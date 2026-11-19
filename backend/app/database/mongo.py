from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

client = AsyncIOMotorClient(settings.mongo_uri)
db = client[settings.mongo_db]

users = db["users"]
measurements = db["measurements"]
recommendations = db["recommendations"]
purchases = db["purchases"]
password_resets = db["password_resets"]


async def init_indexes() -> None:
    await users.create_index("email", unique=True)
    await measurements.create_index([("user_id", 1), ("created_at", -1)])
    await recommendations.create_index([("user_id", 1), ("created_at", -1)])
    await purchases.create_index([("user_id", 1), ("created_at", -1)])
    # MongoDB deletes reset tokens automatically once expires_at passes
    await password_resets.create_index("expires_at", expireAfterSeconds=0)
    await password_resets.create_index("token_hash", unique=True)
