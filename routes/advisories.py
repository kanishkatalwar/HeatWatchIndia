from flask import Blueprint, jsonify, current_app

from database import get_connection, query_all


advisories_bp = Blueprint(
    "advisories",
    __name__
)


@advisories_bp.route("/api/advisories")
def get_advisories():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)


    cursor.execute("""
        SELECT *
        FROM HEATWAVE_ADVISORY
    """)


    advisories = cursor.fetchall()


    cursor.close()
    connection.close()


    return jsonify(advisories)


# NEW (additive): advisories joined to their forecast and region
@advisories_bp.route("/api/advisories/detail")
def get_advisories_detail():
    try:
        rows = query_all("""
            SELECT
                A.Advisory_ID, A.Day, A.Month, A.Year,
                A.Alert_Level, A.Message, A.Forecast_ID,
                F.Max_Temperature,
                R.Region_ID, R.Region_Name, R.State
            FROM HEATWAVE_ADVISORY A
            LEFT JOIN HEATWAVE_FORECAST F
                ON F.Forecast_ID = A.Forecast_ID
            LEFT JOIN REGION R
                ON R.Region_ID = F.Region_ID
            ORDER BY A.Year DESC, A.Month DESC, A.Day DESC,
                     A.Advisory_ID DESC
        """)
        return jsonify(rows)
    except Exception:
        current_app.logger.exception("advisory detail failed")
        return jsonify({"error": "Could not load advisories."}), 500