import hashlib
import base64
import secrets
from typing import Optional


class EncryptionService:
    """Simple encryption service for basic data protection."""
    
    @staticmethod
    def generate_salt() -> str:
        """Generate a random salt for hashing."""
        return base64.b64encode(secrets.token_bytes(32)).decode('utf-8')
    
    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
        """Hash a password with salt. Returns (hashed_password, salt)."""
        if salt is None:
            salt = EncryptionService.generate_salt()
        
        # Combine password and salt
        combined = password + salt
        hashed = hashlib.sha256(combined.encode('utf-8')).hexdigest()
        
        return hashed, salt
    
    @staticmethod
    def verify_password(password: str, hashed_password: str, salt: str) -> bool:
        """Verify a password against its hash."""
        hash_attempt, _ = EncryptionService.hash_password(password, salt)
        return hash_attempt == hashed_password
    
    @staticmethod
    def generate_token() -> str:
        """Generate a secure random token."""
        return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8')
    
    @staticmethod
    def simple_encrypt(text: str, key: str) -> str:
        """Simple XOR-based encryption for demonstration purposes.
        Note: This is for basic obfuscation only, not secure encryption."""
        key_bytes = key.encode('utf-8')
        text_bytes = text.encode('utf-8')
        
        encrypted = bytearray()
        for i, byte in enumerate(text_bytes):
            key_byte = key_bytes[i % len(key_bytes)]
            encrypted.append(byte ^ key_byte)
        
        return base64.b64encode(encrypted).decode('utf-8')
    
    @staticmethod
    def simple_decrypt(encrypted_text: str, key: str) -> str:
        """Simple XOR-based decryption."""
        key_bytes = key.encode('utf-8')
        encrypted_bytes = base64.b64decode(encrypted_text.encode('utf-8'))
        
        decrypted = bytearray()
        for i, byte in enumerate(encrypted_bytes):
            key_byte = key_bytes[i % len(key_bytes)]
            decrypted.append(byte ^ key_byte)
        
        return decrypted.decode('utf-8')