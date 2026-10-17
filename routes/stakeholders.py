import mysql.connector
from flask import Blueprint, jsonify, current_app

from database import get_connection, query_all


stakeholders_bp = Blueprint(
    "stakeholders",
    __name__
)


@stakeholders_bp.route("/api/stakeholders")
def get_stakeholders():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)


    cursor.execute("""
        SELECT *
        FROM STAKEHOLDER
    """)


    stakeholders = cursor.fetchall()


    cursor.close()
    connection.close()


    return jsonify(stakeholders)


# NEW (additive): stakeholders + region + linked advisory count
@stakeholders_bp.route("/api/stakeholders/detail")
def get_stakeholders_detail():
    try:
        stakeholders = query_all("""
            SELECT S.*, R.Region_Name, R.State
            FROM STAKEHOLDER S
            LEFT JOIN REGION R
                ON R.Region_ID = S.Region_ID
            ORDER BY S.Stakeholder_ID
        """)

        # The ADVISORY_STAKEHOLDER columns were not confirmed, so this
        # lookup is optional: if it fails the page simply omits the count.
        counts = {}
        have_counts = True
        try:
            for row in query_all("""
                SELECT Stakeholder_ID, COUNT(*) AS Advisory_Count
                FROM ADVISORY_STAKEHOLDER
                GROUP BY Stakeholder_ID
            """):
                counts[row["Stakeholder_ID"]] = row["Advisory_Count"]
        except mysql.connector.Error:
            have_counts = False

        if have_counts:
            for s in stakeholders:
                s["Advisory_Count"] = counts.get(s["Stakeholder_ID"], 0)

        return jsonify(stakeholders)
    except Exception:
        current_app.logger.exception("stakeholder detail failed")
        return jsonify({"error": "Could not load stakeholders."}), 500