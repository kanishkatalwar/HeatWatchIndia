from flask import Blueprint, jsonify, current_app
from database import get_connection, query_all


dashboard_bp = Blueprint(
    "dashboard",
    __name__
)


@dashboard_bp.route("/api/dashboard")
def get_dashboard():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    # Highest forecast
    cursor.execute("""
        SELECT R.Region_Name, F.Max_Temperature
        FROM HEATWAVE_FORECAST F
        JOIN REGION R
        ON F.Region_ID = R.Region_ID
        ORDER BY F.Max_Temperature DESC
        LIMIT 1
    """)

    highest_forecast = cursor.fetchone()


    # Active stations
    cursor.execute("""
        SELECT COUNT(*) AS Active_Stations
        FROM WEATHER_STATION
        WHERE Status = 'Active'
    """)

    active_stations = cursor.fetchone()


    # Red alerts
    cursor.execute("""
        SELECT COUNT(*) AS Red_Alerts
        FROM HEATWAVE_ADVISORY
        WHERE Alert_Level = 'RED'
    """)

    red_alerts = cursor.fetchone()


    # Total forecasts
    cursor.execute("""
        SELECT COUNT(*) AS Total_Forecasts
        FROM HEATWAVE_FORECAST
    """)

    total_forecasts = cursor.fetchone()


    cursor.close()
    connection.close()


    return jsonify({
        "highest_forecast": highest_forecast,
        "active_stations": active_stations,
        "red_alerts": red_alerts,
        "total_forecasts": total_forecasts
    })


# ==================================================
# NEW (additive) endpoints used by the redesigned UI
# ==================================================

def _iso(value):
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


def _fail(message):
    current_app.logger.exception(message)
    return jsonify({"error": message}), 500


@dashboard_bp.route("/api/dashboard/map")
def get_dashboard_map():
    """Every region with its forecasts (regions without forecasts included)."""
    try:
        rows = query_all("""
            SELECT
                R.Region_ID, R.Region_Name, R.State, R.Climate_Zone,
                F.Forecast_ID, F.Day, F.Month, F.Year,
                F.Max_Temperature, F.Severity_Level
            FROM REGION R
            LEFT JOIN HEATWAVE_FORECAST F
                ON F.Region_ID = R.Region_ID
            ORDER BY R.Region_ID
        """)
        return jsonify(rows)
    except Exception:
        return _fail("Could not load regional map data.")


@dashboard_bp.route("/api/dashboard/trend")
def get_dashboard_trend():
    """Daily max/avg temperature from observations, else from forecasts."""
    try:
        rows = query_all("""
            SELECT
                Observation_Date AS Day_Value,
                MAX(Temperature) AS Max_Temp,
                AVG(Temperature) AS Avg_Temp
            FROM WEATHER_OBSERVATION
            WHERE Temperature IS NOT NULL
            GROUP BY Observation_Date
            ORDER BY Observation_Date DESC
            LIMIT 30
        """)

        if rows:
            rows.reverse()
            return jsonify({
                "source": "observations",
                "points": [
                    {"label": _iso(r["Day_Value"]),
                     "max": r["Max_Temp"], "avg": r["Avg_Temp"]}
                    for r in rows
                ]
            })

        rows = query_all("""
            SELECT Year, Month, Day, MAX(Max_Temperature) AS Max_Temp
            FROM HEATWAVE_FORECAST
            WHERE Max_Temperature IS NOT NULL
            GROUP BY Year, Month, Day
            ORDER BY Year, Month, Day
        """)

        points = [
            {"label": "%04d-%02d-%02d" % (r["Year"], r["Month"], r["Day"]),
             "max": r["Max_Temp"], "avg": None}
            for r in rows
        ]

        return jsonify({
            "source": "forecasts" if points else "none",
            "points": points
        })
    except Exception:
        return _fail("Could not load temperature trend.")


@dashboard_bp.route("/api/dashboard/stats")
def get_dashboard_stats():
    """Quick statistics over WEATHER_OBSERVATION."""
    try:
        rows = query_all("""
            SELECT
                COUNT(*) AS Readings,
                AVG(Temperature) AS Avg_Temp,
                MAX(Temperature) AS Max_Temp,
                MIN(Temperature) AS Min_Temp,
                AVG(Humidity) AS Avg_Humidity,
                MAX(Humidity) AS Max_Humidity
            FROM WEATHER_OBSERVATION
        """)
        return jsonify(rows[0] if rows else {})
    except Exception:
        return _fail("Could not load observation statistics.")