.PHONY: test test-api test-frontend

test: test-api test-frontend

test-api:
	cd services/api && PYTHONPATH=. python3 -m unittest discover -s tests -p "test_*.py"

test-frontend:
	cd services/frontend && npm test --silent
