# Contributing

Thanks for improving fiber-map.

## Development setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

mysql -u fibermap -p fiber_map < demo/fiber-map-demo.sql
python run.py --port 5003
```

Set a demo administrator password before logging in:

```bash
python manage.py changepassword admin
```

## Before opening a pull request

- Run `python manage.py check`.
- Run `python manage.py makemigrations --check --dry-run`.
- If you changed `frontend/src`, rebuild the React app and update the asset references.
- Keep demo records fictional. Never commit real customer names, phone numbers, locations, passwords or tokens.
- Do not commit `site_config.json`, `.env`, database dumps or uploaded media.
- Describe the change and the affected screens/APIs in the pull request.

## Reporting bugs

Open an issue at <https://github.com/johirxofficial/fiber-map/issues> with:

- Steps to reproduce
- Expected and actual behaviour
- Browser/OS/Python/MySQL versions
- Relevant console or server errors (remove secrets first)
