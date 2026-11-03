import getpass
import hashlib
import json
import secrets
from pathlib import Path


STAFF_FILE = Path(__file__).with_name("staff.json")
PASSWORD_HASH_ITERATIONS = 310_000


def main():
    username = input("Staff username: ").strip()
    if not username:
        raise SystemExit("Username cannot be empty.")

    if STAFF_FILE.exists():
        with STAFF_FILE.open(encoding="utf-8") as staff_file:
            data = json.load(staff_file)
    else:
        data = {"staff": []}

    if any(account["username"] == username for account in data["staff"]):
        raise SystemExit("That username already exists.")

    password = getpass.getpass("Staff password (at least 12 characters): ")
    if len(password) < 12:
        raise SystemExit("Password must be at least 12 characters.")
    if password != getpass.getpass("Confirm password: "):
        raise SystemExit("Passwords do not match.")

    salt = secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_HASH_ITERATIONS
    ).hex()
    data["staff"].append(
        {
            "username": username,
            "salt": salt.hex(),
            "password_hash": password_hash,
        }
    )

    with STAFF_FILE.open("w", encoding="utf-8") as staff_file:
        json.dump(data, staff_file, indent=2)
        staff_file.write("\n")

    print(f"Created staff account '{username}' in {STAFF_FILE.name}.")


if __name__ == "__main__":
    main()