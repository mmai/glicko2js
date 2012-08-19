DIRNPM=toNPM

test:
	npm test

build:
	rm -rf $(DIRNPM)
	mkdir $(DIRNPM)
	cp glicko2.js $(DIRNPM)
	cp package.json $(DIRNPM)
	cp README.md $(DIRNPM)
	cp -R test $(DIRNPM)

publish: build
	npm publish $(DIRNPM)

.PHONY: test
