# PawWalk monorepo — convenience targets.
# Each app keeps its own native toolchain; these just wrap the common commands.

.PHONY: help backend backend-test landing landing-build ios android-build

help:
	@echo "PawWalk monorepo"
	@echo "  make backend        - run the FastAPI API in dev mode (:8000)"
	@echo "  make backend-test   - run backend tests"
	@echo "  make landing        - run the Next.js landing page (:3000)"
	@echo "  make landing-build  - production build of the landing page"
	@echo "  make ios            - generate + open the Xcode project (macOS only)"
	@echo "  make android-build  - assemble a debug APK (needs Android SDK)"

backend:
	cd apps/backend && uv sync && uv run fastapi dev

backend-test:
	cd apps/backend && uv run pytest

landing:
	cd apps/landing && npm install && npm run dev

landing-build:
	cd apps/landing && npm install && npm run build

ios:
	cd apps/ios && xcodegen generate && open PawWalk.xcodeproj

android-build:
	cd apps/android && ./gradlew assembleDebug
