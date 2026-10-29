DIRNPM=toNPM

test:
	npm test

build:
	rm -rf $(DIRNPM)
	mkdir $(DIRNPM)
	cp glicko2.js $(DIRNPM)
	cp glicko2.d.ts $(DIRNPM)
	cp package.json $(DIRNPM)
	cp READMEnpm.md $(DIRNPM)/README.md
	cp -R test $(DIRNPM)

publish: build
	cd $(DIRNPM) && npm publish .

.PHONY: test
