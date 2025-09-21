import pytest
import tempfile
import os
from app.services.encryption import EncryptionService


def test_encryption_roundtrip():
    """Test encryption and decryption roundtrip."""
    original_text = "This is a secret message"
    key = "test-encryption-key"
    
    # Encrypt
    encrypted = EncryptionService.simple_encrypt(original_text, key)
    assert encrypted != original_text
    assert isinstance(encrypted, str)
    
    # Decrypt
    decrypted = EncryptionService.simple_decrypt(encrypted, key)
    assert decrypted == original_text


def test_password_hashing():
    """Test password hashing and verification."""
    password = "my-secure-password"
    
    # Hash password
    hashed, salt = EncryptionService.hash_password(password)
    assert hashed != password
    assert len(salt) > 0
    
    # Verify correct password
    assert EncryptionService.verify_password(password, hashed, salt)
    
    # Verify wrong password
    assert not EncryptionService.verify_password("wrong-password", hashed, salt)


def test_token_generation():
    """Test token generation."""
    token1 = EncryptionService.generate_token()
    token2 = EncryptionService.generate_token()
    
    assert len(token1) > 0
    assert len(token2) > 0
    assert token1 != token2  # Should be unique


def test_salt_generation():
    """Test salt generation."""
    salt1 = EncryptionService.generate_salt()
    salt2 = EncryptionService.generate_salt()
    
    assert len(salt1) > 0
    assert len(salt2) > 0
    assert salt1 != salt2  # Should be unique


def test_encryption_with_different_keys():
    """Test that different keys produce different results."""
    text = "Test message"
    key1 = "key1"
    key2 = "key2"
    
    encrypted1 = EncryptionService.simple_encrypt(text, key1)
    encrypted2 = EncryptionService.simple_encrypt(text, key2)
    
    assert encrypted1 != encrypted2
    
    # Each should only decrypt with its own key
    assert EncryptionService.simple_decrypt(encrypted1, key1) == text
    assert EncryptionService.simple_decrypt(encrypted2, key2) == text
    
    # Wrong key should not work (will likely produce garbage)
    assert EncryptionService.simple_decrypt(encrypted1, key2) != text