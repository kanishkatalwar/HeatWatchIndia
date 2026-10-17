from flask import Blueprint, jsonify, current_app
from database import get_connection, query_all


stations_bp = Blueprint(
    "stations",
    __name__
)


@stations_bp.route("/api/stations")
def get_stations():

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM WEATHER_STATION
    """)

    stations = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(stations)


# NEW (additive): stations + region + most recent observation
@stations_bp.route("/api/stations/detail")
def get_stations_detail():
    try:
        stations = query_all("""
            SELECT S.*, R.Region_Name, R.State
            FROM WEATHER_STATION S
            LEFT JOIN REGION R
                ON R.Region_ID = S.Region_ID
            ORDER BY S.Station_ID
        """)

        latest = query_all("""
            SELECT Station_ID, Observation_Date, Temperature, Humidity
            FROM (
                SELECT
                    O.Station_ID, O.Observation_Date,
                    O.Temperature, O.Humidity,
                    ROW_NUMBER() OVER (
                        PARTITION BY O.Station_ID
                        ORDER BY O.Observation_Date DESC,
                                 O.Observation_ID DESC
                    ) AS rn
                FROM WEATHER_OBSERVATION O
            ) latest_obs
            WHERE rn = 1
        """)

        by_station = {row["Station_ID"]: row for row in latest}

        for station in stations:
            obs = by_station.get(station["Station_ID"])
            station["Latest_Temperature"] = obs["Temperature"] if obs else None
            station["Latest_Humidity"] = obs["Humidity"] if obs else None

            date_value = obs["Observation_Date"] if obs else None
            station["Latest_Observation_Date"] = (
                date_value.isoformat()
                if hasattr(date_value, "isoformat")
                else (str(date_value) if date_value else None)
            )

        return jsonify(stations)
    except Exception:
        current_app.logger.exception("station detail failed")
        return jsonify({"error": "Could not load stations."}), 500