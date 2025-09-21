import json
import os
import fcntl
import time
from typing import Any, Dict, List, Optional
from contextlib import contextmanager


class AtomicJsonStorage:
    """Atomic JSON storage with file locking to prevent race conditions."""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
    
    def _get_file_path(self, filename: str) -> str:
        """Get full path for data file."""
        return os.path.join(self.data_dir, filename)
    
    def _get_lock_path(self, filename: str) -> str:
        """Get full path for lock file."""
        return os.path.join(self.data_dir, f"{filename}.lock")
    
    @contextmanager
    def _file_lock(self, filename: str):
        """Context manager for file locking."""
        lock_path = self._get_lock_path(filename)
        lock_file = None
        try:
            lock_file = open(lock_path, 'w')
            # Use non-blocking lock with retry for better test compatibility
            timeout = 10
            retry_count = 0
            while retry_count < timeout:
                try:
                    fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                    break
                except IOError:
                    retry_count += 1
                    time.sleep(0.1)
            else:
                raise IOError("Could not acquire file lock")
            yield
        finally:
            if lock_file:
                try:
                    fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
                    lock_file.close()
                except:
                    pass  # Ignore errors during cleanup
                try:
                    os.remove(lock_path)
                except OSError:
                    pass  # Ignore if file doesn't exist
    
    def read_json(self, filename: str) -> Dict[str, Any]:
        """Read JSON data with file locking."""
        file_path = self._get_file_path(filename)
        
        with self._file_lock(filename):
            if not os.path.exists(file_path):
                return {}
            
            with open(file_path, 'r') as f:
                return json.load(f)
    
    def write_json(self, filename: str, data: Dict[str, Any]) -> None:
        """Write JSON data with file locking."""
        file_path = self._get_file_path(filename)
        
        with self._file_lock(filename):
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
    
    def update_json(self, filename: str, update_func) -> Dict[str, Any]:
        """Update JSON data atomically."""
        file_path = self._get_file_path(filename)
        
        with self._file_lock(filename):
            # Read current data
            if not os.path.exists(file_path):
                data = {}
            else:
                with open(file_path, 'r') as f:
                    data = json.load(f)
            
            # Apply update function
            updated_data = update_func(data)
            
            # Write updated data
            with open(file_path, 'w') as f:
                json.dump(updated_data, f, indent=2, ensure_ascii=False)
            
            return updated_data


# Global storage instance
storage = AtomicJsonStorage()