#!/bin/sh

root=$(dirname $0)

forever start --workingDir ${root} -a -l util.audio.log -c test/node_modules/.bin/http-server test/platforms/browser/www -p 8015