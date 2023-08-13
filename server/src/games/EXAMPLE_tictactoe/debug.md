# Using the debug view

Go to http://localhost:3000/debug/TicTacToe/2.

Then, paste one of the following series of UI Actions to simulate a game.
You may need to make some adjustments based on who the first player is.

# B win

```json
{"playerName":"B","BOARD":[[1,1]]}
{"playerName":"A","BOARD":[[0,0]]}
{"playerName":"B","BOARD":[[0,1]]}
{"playerName":"A","BOARD":[[2,1]]}
{"playerName":"B","BOARD":[[0,2]]}
{"playerName":"A","BOARD":[[1,0]]}
{"playerName":"B","BOARD":[[2,0]]}
```

# B tie

```json
{"playerName":"B","BOARD":[[0,0]]}
{"playerName":"A","BOARD":[[1,0]]}
{"playerName":"B","BOARD":[[0,1]]}
{"playerName":"A","BOARD":[[0,2]]}
{"playerName":"B","BOARD":[[1,2]]}
{"playerName":"A","BOARD":[[1,1]]}
{"playerName":"B","BOARD":[[2,0]]}
{"playerName":"A","BOARD":[[2,1]]}
{"playerName":"B","BOARD":[[2,2]]}
```

# Error: Cell not empty

```json
{"playerName":"B","BOARD":[[1,1]]}
{"playerName":"A","BOARD":[[1,1]]}
```

# Error: Cell not formatted correctly

```json
{ "playerName": "B", "BOARD": [[0, 0, 0]] }
```

# Error: Cell out of bounds

```json
{ "playerName": "B", "BOARD": [[199, 199]] }
```
