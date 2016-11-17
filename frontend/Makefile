CloudEdu-Frontend:
	make -C ./typescript
	browserify -o build/bundle.js ts_compiled/index.js
	uglifyjs -o build/bundle.min.js build/bundle.js
	cp -r html/* build/
	cp -r prebuilt_scripts/* build/scripts/
