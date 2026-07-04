.PHONY: dev build test run cross
dev:
	npm run dev
build:
	npm run build
test:
	npm test
run:
	npm run start
cross:
	docker buildx build --platform linux/arm64 .