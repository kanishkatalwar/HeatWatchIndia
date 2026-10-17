from flask import Flask, render_template

from routes.dashboard import dashboard_bp
from routes.forecasts import forecasts_bp
from routes.advisories import advisories_bp
from routes.stations import stations_bp
from routes.stakeholders import stakeholders_bp


app = Flask(__name__)


# ================= API BLUEPRINTS =================

app.register_blueprint(dashboard_bp)
app.register_blueprint(forecasts_bp)
app.register_blueprint(advisories_bp)
app.register_blueprint(stations_bp)
app.register_blueprint(stakeholders_bp)


# ================= MAIN PAGES =================

@app.route("/")
def home():
    return render_template("dashboard.html")


@app.route("/forecasts")
def forecasts_page():
    return render_template("forecasts.html")


@app.route("/advisories")
def advisories_page():
    return render_template("advisories.html")


@app.route("/stations")
def stations_page():
    return render_template("stations.html")


@app.route("/stakeholders")
def stakeholders_page():
    return render_template("stakeholders.html")


if __name__ == "__main__":
    app.run(debug=True)