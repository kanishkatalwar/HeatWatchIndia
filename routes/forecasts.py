from flask import Blueprint, jsonify, current_app

from database import get_connection, query_all


forecasts_bp = Blueprint(
    "forecasts",
    __name__
)


@forecasts_bp.route("/api/forecasts")
def get_forecasts():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)


    cursor.execute("""
        SELECT
            R.Region_Name,
            F.Max_Temperature
        FROM HEATWAVE_FORECAST F
        JOIN REGION R
        ON F.Region_ID = R.Region_ID
        ORDER BY F.Max_Temperature DESC
    """)


    forecasts = cursor.fetchall()


    cursor.close()
    connection.close()


    return jsonify(forecasts)


# NEW (additive): full forecast rows for the Forecasts page
@forecasts_bp.route("/api/forecasts/detail")
def get_forecasts_detail():
    try:
        rows = query_all("""
            SELECT
                F.Forecast_ID, F.Day, F.Month, F.Year,
                F.Max_Temperature, F.Severity_Level,
                F.Region_ID, F.Observation_ID,
                R.Region_Name, R.State
            FROM HEATWAVE_FORECAST F
            LEFT JOIN REGION R
                ON R.Region_ID = F.Region_ID
            ORDER BY F.Max_Temperature DESC
        """)
        return jsonify(rows)
    except Exception:
        current_app.logger.exception("forecast detail failed")
        return jsonify({"error": "Could not load forecasts."}), 500