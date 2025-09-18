import pytest
import tempfile
import os
import json
from app.services.storage import AtomicJsonStorage


@pytest.fixture
def temp_storage():
    """Create a temporary storage for testing."""
    with tempfile.TemporaryDirectory() as temp_dir:
        storage = AtomicJsonStorage(temp_dir)
        yield storage


def test_read_write_json(temp_storage):
    """Test basic JSON read/write operations."""
    filename = "test.json"
    test_data = {"key": "value", "number": 42}
    
    # Write data
    temp_storage.write_json(filename, test_data)
    
    # Read data
    read_data = temp_storage.read_json(filename)
    assert read_data == test_data


def test_read_nonexistent_file(temp_storage):
    """Test reading a file that doesn't exist."""
    result = temp_storage.read_json("nonexistent.json")
    assert result == {}


def test_update_json(temp_storage):
    """Test atomic update operation."""
    filename = "update_test.json"
    initial_data = {"counter": 0}
    
    # Write initial data
    temp_storage.write_json(filename, initial_data)
    
    # Update data
    def increment_counter(data):
        data["counter"] += 1
        return data
    
    result = temp_storage.update_json(filename, increment_counter)
    assert result["counter"] == 1
    
    # Verify update persisted
    read_data = temp_storage.read_json(filename)
    assert read_data["counter"] == 1


def test_file_locking_creates_lock_file(temp_storage):
    """Test that file locking creates and removes lock files."""
    filename = "lock_test.json"
    
    with temp_storage._file_lock(filename):
        # During lock, lock file should exist
        lock_path = temp_storage._get_lock_path(filename)
        assert os.path.exists(lock_path)
    
    # After lock, lock file should be removed
    assert not os.path.exists(lock_path)


def test_concurrent_access_simulation(temp_storage):
    """Test that multiple operations work correctly."""
    filename = "concurrent_test.json"
    
    # Simulate multiple updates
    for i in range(5):
        def add_item(data):
            if "items" not in data:
                data["items"] = []
            data["items"].append(f"item_{i}")
            return data
        
        temp_storage.update_json(filename, add_item)
    
    # Verify all items were added
    final_data = temp_storage.read_json(filename)
    assert len(final_data["items"]) == 5
    assert "item_0" in final_data["items"]
    assert "item_4" in final_data["items"]