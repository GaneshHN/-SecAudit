import os
import hashlib

# Hardcoded credentials in Python
API_SECRET = "sk-live-4eC39HqLyjWDarjtT1zdp7dc"
DATABASE_PASSWORD = "root_password_123!"
auth_token = "bearer_eyJhbGciOiJIUzI1NiJ9.dGVzdA.xyz123456789"

# Insecure HTTP
ENDPOINT = "http://legacy-api.internal.corp/v1/data"

# Weak hash
md5_hash = hashlib.md5(b"data").hexdigest()

# Debug enabled
DEBUG = True

# Hardcoded database URL
DB_URL = "postgres://dbuser:mypassword@192.168.0.10:5432/app_db"

# TODO: fix security vulnerability in user authentication
# FIXME: remove hardcoded credentials before deployment

# eval usage
user_input = "2 + 2"
result = eval(user_input)

print(f"User password is: {DATABASE_PASSWORD}")
print(f"Secret token: {auth_token}")
