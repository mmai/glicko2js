DIRNPM=toNPM

test:
	npm test

build:
	rm -rf $(DIRNPM)
	mkdir $(DIRNPM)
	cp glicko2.js $(DIRNPM)
	cp package.json $(DIRNPM)
	cp READMEnpm.md $(DIRNPM)/README.md
	cp -R test $(DIRNPM)

publish: build
	cd $(DIRNPM)
	npm publish .
	cd ..

.PHONY: test
