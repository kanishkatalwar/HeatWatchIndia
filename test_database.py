from database import get_connection


try:
    connection = get_connection()

    if connection.is_connected():
        print("Database connected successfully!")

        cursor = connection.cursor()

        cursor.execute("SELECT DATABASE();")

        result = cursor.fetchone()

        print("Connected database:", result[0])

        cursor.close()
        connection.close()

except Exception as e:
    print("Database connection failed!")
    print("Error:", e)