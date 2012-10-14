compile:
	@make compile-src & make compile-ui && fg
compile-src:
	coffee -w -o ./lib -c ./src
