#!/bin/sh

# Usage: ./cron.sh -i corners-staging -p 5057

fail() {
  local message=$1

  echo "⏪ Aborting: $message" >>/dev/stderr

  rm $lockfile # remove the lock file
  exit 1
}

#
# Command-line options (see: http://mywiki.wooledge.org/BashFAQ/035)
#

show_help() {
    cat << EOF
Usage: ${0##*/} [options]

Options:
  -i, --docker-image=...      Name of the docker image to build
  -c, --docker-container=...  Name of the docker container to run
  -p, --port=...              Port on which run the docker container
EOF
    exit 1
}

DOCKERIMAGENAME=corners
CONTAINERNAME=${DOCKERIMAGENAME}
PORT=5056

verbose=0

while :; do
  case $1 in
    -h|-\?|--help)
      show_help    # Display a usage synopsis.
      exit
      ;;

    #
    # --docker-image
    #

    -i|--docker-image)       # Takes an option argument; ensure it has been specified.
      if [ "$2" ]; then
        DOCKERIMAGENAME=$2
        shift
      else
        fail 'ERROR: "--docker-image" requires a non-empty option argument.'
      fi
      ;;
    --docker-image=?*)
      DOCKERIMAGENAME=${1#*=} # Delete everything up to "=" and assign the remainder.
      ;;
    --docker-image=)         # Handle the case of an empty --docker-image=
      fail 'ERROR: "--docker-image" requires a non-empty option argument.'
      ;;

    #
    # --docker-container
    #

    -c|--docker-container)       # Takes an option argument; ensure it has been specified.
      if [ "$2" ]; then
        CONTAINERNAME=$2
        shift
      else
        fail 'ERROR: "--docker-container" requires a non-empty option argument.'
      fi
      ;;
    --docker-container=?*)
      CONTAINERNAME=${1#*=} # Delete everything up to "=" and assign the remainder.
      ;;
    --docker-container=)         # Handle the case of an empty --docker-container=
      fail 'ERROR: "--docker-container" requires a non-empty option argument.'
      ;;
    
    #
    # --port
    #

    -p|--port)       # Takes an option argument; ensure it has been specified.
      if [ "$2" ]; then
        PORT=$2
        shift
      else
        fail 'ERROR: "--port" requires a non-empty option argument.'
      fi
      ;;
    --port=?*)
      PORT=${1#*=} # Delete everything up to "=" and assign the remainder.
      ;;
    --port=)         # Handle the case of an empty --port=
      fail 'ERROR: "--port" requires a non-empty option argument.'
      ;;

    -v|--verbose)
      verbose=$((verbose + 1))  # Each -v adds 1 to verbosity.
      ;;

    --)              # End of all options.
      shift
      break
      ;;
    -?*)
      printf 'WARN: Unknown option (ignored): %s\n' "$1" >&2
      ;;
    *)               # Default case: No more options, so break out of the loop.
      break
  esac

  shift
done

isPidRunning() {
  if ps -ax |grep -v grep |grep $1; then
    echo "YES, pid $1 is actually running"
    return 0 # yes
  else
    echo "NO, pid $1 is not running"
    return 1 # no
  fi
}

dockerbuild() {
  docker build --rm \
    -t $DOCKERIMAGENAME . && echo "Docker image built."

  # Removing dangling images (see: https://docs.docker.com/engine/reference/commandline/image_prune/)
  docker image prune --force && echo "Docker image pruned."
}

dockerrun() {
  docker run -d --rm \
    --name $CONTAINERNAME \
    -p $PORT:80 \
    $DOCKERIMAGENAME
}

mkdir -p tmp
# Prevent executing this script a second time if not finished
lockfile=tmp/cron.lock
if [ -f $lockfile ]; then
  pid=`cat $lockfile`

  # let verify the pid is actually really running
  if isPidRunning $pid; then
    echo "Already running, pid: $pid"
    exit 1
  else
    echo "Dead lockfile, let's rm it and continue"
    rm $lockfile || fail '`rm` dead lockfile failed'
  fi
fi
echo "$$" >$lockfile



# check if pull needed (see: https://stackoverflow.com/a/3278427/133327)
needpull() {
  # Bring your remote refs up to date (Pre-requisite, ie: need to be first)
  git remote update || fail '`git remote update` failed'

  local UPSTREAM=${1:-'@{u}'}
  local LOCAL=$(git rev-parse @)
  local REMOTE=$(git rev-parse "$UPSTREAM")
  local BASE=$(git merge-base @ "$UPSTREAM")

  echo "UPSTREAM: $UPSTREAM"
  echo "LOCAL: $LOCAL"
  echo "REMOTE: $REMOTE"
  echo "BASE: $BASE"

  if [ $LOCAL = $REMOTE ]; then
    echo "Up-to-date"

    return 1
  elif [ $LOCAL = $BASE ]; then
    echo "Need to pull"

    return 0
  elif [ $REMOTE = $BASE ]; then
      echo "Need to push"

      return 1
  else
      echo "Diverged"

      return 1
  fi
}

if needpull; then
  #
  # Pull changes
  #

  git pull --recurse-submodules || fail  '`git pull` failed'

  #
  # Build
  #

  dockerbuild || fail  '`dockerbuild` failed'

  #
  # Run
  #

  # Kill the previous server (if any)
  if lsof -ti :$PORT; then
    echo "Previous server is running => let's kill it"
    docker kill $CONTAINERNAME || fail '`docker kill` failed'
    #docker rm $CONTAINERNAME
  else
    echo "No previous server is running => no need to kill anyone"
  fi
  
  # Serve
  echo "Now that there is no more server, let's start a new one from the latest build"
  dockerrun || fail '`dockerrun` failed'
fi

#
# Make sure a container is running: otherwise start one
#

if lsof -ti :$PORT; then
  echo "Previous server is already running: no need to launch one"
else
  echo "No previous server is running => let's start one"

  # Make sure an image exist, otherwise build one
  if $(docker image inspect $DOCKERIMAGENAME >/dev/null 2>&1); then
    echo "Previous docker image already exist: no need to build one"
  else
    echo "There is no $DOCKERIMAGENAME image available => let's build one!"
    dockerbuild || fail  '`dockerbuild` failed'
  fi

  dockerrun || fail '`dockerrun` failed'
fi

#sleep 10
rm $lockfile || fail '`rm $lockfile` failed'

exit 0