import random
import string
from datetime import datetime, timedelta
from twilio.rest import Client
from app.config import get_settings
from app.utils.database import get_db
from app.models.user import OTP

settings = get_settings()

class OTPService:
    def __init__(self):
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            self.client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
        else:
            self.client = None
    
    def generate_otp(self, length: int = 6) -> str:
        """Generate random OTP"""
        return ''.join(random.choices(string.digits, k=length))
    
    def send_otp(self, phone: str, db) -> str:
        """Send OTP to phone number"""
        otp_code = self.generate_otp()
        
        # Save OTP to database
        otp = OTP(
            phone=phone,
            code=otp_code,
            expires_at=datetime.utcnow() + timedelta(minutes=10)
        )
        db.add(otp)
        db.commit()
        
        # Send via Twilio (if configured)
        if self.client:
            try:
                message = self.client.messages.create(
                    body=f"Your Interview Practice Partner verification code is: {otp_code}",
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=phone
                )
                print(f"OTP sent: {message.sid}")
            except Exception as e:
                print(f"Failed to send OTP via Twilio: {e}")
        else:
            # For development: just print the OTP
            print(f"OTP for {phone}: {otp_code}")
        
        return otp_code
    
    def verify_otp(self, phone: str, code: str, db) -> bool:
        """Verify OTP"""
        otp = db.query(OTP).filter(
            OTP.phone == phone,
            OTP.code == code,
            OTP.is_used == False,
            OTP.expires_at > datetime.utcnow()
        ).first()
        
        if otp:
            otp.is_used = True
            db.commit()
            return True
        
        return False

otp_service = OTPService()