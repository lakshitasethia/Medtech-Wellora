.PHONY: install train serve test clean

install:
	python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

train:
	.venv/bin/python train.py

serve:
	.venv/bin/uvicorn app.main:app --reload --port 8000

test:
	.venv/bin/python -m pytest -q

clean:
	rm -rf __pycache__ app/__pycache__ tests/__pycache__ .pytest_cache
