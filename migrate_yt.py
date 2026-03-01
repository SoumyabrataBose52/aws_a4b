import sys
sys.path.insert(0, ".")
from app.database import engine
from sqlalchemy import text

# Add new columns if they don't exist
new_columns = [
    ("youtube_channel_id", "VARCHAR(50)"),
    ("youtube_handle", "VARCHAR(100)"),
    ("subscribers", "INT"),
    ("total_views", "INT"),
    ("video_count", "INT"),
]

with engine.connect() as conn:
    for col_name, col_type in new_columns:
        try:
            conn.execute(text(f"ALTER TABLE creators ADD COLUMN {col_name} {col_type} NULL"))
            print(f"Added column: {col_name}")
        except Exception as e:
            if "Duplicate column" in str(e) or "already exists" in str(e):
                print(f"Column {col_name} already exists, skipping")
            else:
                print(f"Error adding {col_name}: {e}")
    conn.commit()

print("Migration complete!")
