# Create deploy directory
if [ ! -d "boardgames-deploy" ]; then
    echo "The directory boardgames-deploy does not exist."
    echo "Follow deployment instructions in README.md."
    exit 1
fi

# Compile the server and copy types to the client
cd server
npm run syncfe

# Create React production build
cd ../client
npm run build

# * matches all files except dotfiles, which is good because we still need
# .git to deploy to Heroku.
cd ..
rm -rf boardgames-deploy/*
cp -r server/dist boardgames-deploy
# Copy over demo jeopardy games
cp server/src/games/jeopardy/*.html boardgames-deploy/dist/src/games/jeopardy
cp deploy_package.json boardgames-deploy/package.json
cp -r client/build boardgames-deploy/dist

cd boardgames-deploy
git add *
git commit -am "New deployment"
git push heroku master
