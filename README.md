# HeatWatch India

A heatwave monitoring and early-warning dashboard built as a DBMS mini project.
It reads forecasts, observations, advisories, weather stations and stakeholders
from a MySQL database and shows them on an interactive India map, tables and charts.

## Features
- Interactive India map coloured by forecast temperature (click a state to zoom in, click again to zoom out)
- Dashboard with highest forecast, active stations, red alerts and temperature trend
- Forecasts, Advisories, Weather Stations and Stakeholders pages with search, sort and filters
- Read-only JSON API built with Flask blueprints

## Tech stack
MySQL 8.0 · Python 3 · Flask · mysql-connector-python · Jinja2 · HTML, CSS, JavaScript, SVG

## Database
7 tables: `REGION`, `WEATHER_STATION`, `WEATHER_OBSERVATION`, `HEATWAVE_FORECAST`,
`HEATWAVE_ADVISORY`, `STAKEHOLDER`, `ADVISORY_STAKEHOLDER`.
Create a database named `heatwatch_india` and import `schema.sql`.

## Run locally
1. Install the libraries: `pip install -r requirements.txt`
2. Set your MySQL login as environment variables (or in your PyCharm run configuration):
   `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
3. Start the app: `python app.py`
4. Open http://127.0.0.1:5000

## Project structure
```
app.py            Flask app and page routes
database.py       MySQL connection and query helper
routes/           API blueprints (dashboard, forecasts, advisories, stations, stakeholders)
templates/        Jinja2 pages (base.html + one page each)
static/           CSS, JavaScript and images
```

## Notes
The map outline is drawn from approximate coordinates and is not an official boundary.
Risk labels use a simple temperature rule (45 °C and above is Critical, 43 °C and above is High).