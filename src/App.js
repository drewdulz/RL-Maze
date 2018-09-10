import React, { Component } from 'react';
import { DQNSolver, DQNOpt, DQNEnv } from 'reinforce-js';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props)

    this.gridSize = 20
    this.grid = Array.apply(null, { length: this.gridSize }).map(Number.call, Number)
    this.interval = null

    this.state = {
      goalX: 0,
      goalY: 0,
      currentX: 0,
      currentY: 0,
      moveCount: 0,
      speed: 5
    }
  }

  componentDidMount() {
    this.init()
  }

  init = () => {
    this.reset()
  }

  reset = () => {
    if(this.interval) { clearInterval(this.interval) }
    this.setState({
      goalX: Math.floor(Math.random() * this.gridSize),
      goalY: Math.floor(Math.random() * this.gridSize),
      currentX: 0,
      currentY: 0,
      moveCount: 0
    })
  }
  startRandomSearch = () => {
    let iterate = () => {
      setTimeout(() => {
        const newCoords = this.randomMove()
        this.setState({ ...newCoords }, () => {
          this.setState({ moveCount: this.state.moveCount + 1 })
          if (this.hasHitGoal()) {
            clearInterval(this.interval)
          } else {
            iterate()
          }
        })
      }, (1/this.state.speed) * 100)
    }
    iterate()

  }
  startRLSearch = () => {
    const width = this.gridSize;
    const height = this.gridSize;
    const numberOfStates = 4;
    const numberOfActions = 4;
    const env = new DQNEnv(width, height, numberOfStates, numberOfActions);

    const opt = new DQNOpt();
    opt.setTrainingMode(false);
    opt.setNumberOfHiddenUnits([100]);  
    opt.setEpsilonDecay(1.0, 0.1, 1e6);
    opt.setEpsilon(0.05);
    opt.setGamma(0.9);
    opt.setAlpha(0.005);
    opt.setLossClipping(true);
    opt.setLossClamp(1.0);
    opt.setRewardClipping(true);
    opt.setRewardClamp(1.0);
    opt.setExperienceSize(1e6);
    opt.setReplayInterval(5);
    opt.setReplaySteps(5);

    const dqnSolver = new DQNSolver(env, opt);


    let iterate = () => {
      setTimeout(() => {
        const { goalX, goalY, currentX, currentY } = this.state
  
        const state = [ currentX, currentY, goalX, goalY ]
        const action = dqnSolver.decide(state)
        const newCoords = this.RLMove(action)
        console.log(`Moving to coordinates: [${newCoords.currentX}, ${newCoords.currentY}]`)
        const reward = this.calculateReward(newCoords)
        dqnSolver.learn(reward);
  
        this.setState({ ...newCoords }, () => {
          this.setState({moveCount: this.state.moveCount+1})
          if (this.hasHitGoal()) {
            clearInterval(this.interval)
          } else {
            iterate()
          }
        })
      }, (1 / this.state.speed) * 100)
    }
    iterate()
  }

  isGoalBlock = function(row, col) {
    const {goalX, goalY} = this.state
    return col===goalX && row===goalY
  }
  isCurrentBlock = function(row, col) {
    const {currentX, currentY} = this.state
    return col === currentX && row === currentY
  }
  hasHitGoal = function() {
    const {goalX, goalY, currentX, currentY} = this.state
    return (currentX === goalX && currentY === goalY)
  }
  canMove = function(desiredCoord) {
    return desiredCoord >= 0 && desiredCoord <= this.gridSize-1
  }
  RLMove = function(moveNum) {
    const { currentX, currentY } = this.state
    let newX, newY
    switch(moveNum) {
      case 0:
        console.log(`Attempting to move +1 in X Direction`)
        newX = this.canMove(currentX + 1) ? currentX + 1 : currentX
        return {
          currentX: newX,
          currentY
        }
      case 1:
        console.log(`Attempting to move -1 in X Direction`)
        newX = this.canMove(currentX - 1) ? currentX - 1 : currentX
        return {
          currentX: newX,
          currentY
        }
      case 2:
        console.log(`Attempting to move +1 in Y Direction`)
        newY = this.canMove(currentY + 1) ? currentY + 1 : currentY
        return {
          currentX,
          currentY: newY
        }
      case 3:
        console.log(`Attempting to move -1 in Y Direction`)

        newY = this.canMove(currentY - 1) ? currentY - 1 : currentY

        return {
          currentX,
          currentY: newY
        }
      }
  }
  calculateReward = function(newCoords) {
    const newDistanceToGoal = this.calculateDistance(newCoords.currentX, newCoords.currentY, this.state.goalX, this.state.goalY)
    const oldDistanceToGoal = this.calculateDistance(this.state.currentX, this.state.currentY, this.state.goalX, this.state.goalY)
    let reward
    if (newCoords.currentX == this.state.currentX && newCoords.currentY == this.state.currentY) {
      console.log('Giving big punishment for impossible move')
      return -100 // Big punishment for non-existent coordinate
    }
    if(newDistanceToGoal < oldDistanceToGoal) {
      console.log('Giving big reward for good move')
      reward = 10 * (1 / newDistanceToGoal)
    } else if (newDistanceToGoal == oldDistanceToGoal) {
      console.log('Giving small reward for neutral move')
      reward = 0.5
    } else {
      console.log('Punishing for bad move')
      reward = -1 * newDistanceToGoal // Farther away results in larger punishment
    }
    return reward
  }
  calculateDistance = function (x1, y1, x2, y2) {
    let xs = x2 - x1;
    let ys = y2 - y1;
    xs *= xs;
    ys *= ys;
    return Math.sqrt(xs + ys);
  }
  randomMove = function() {
    const { currentX, currentY } = this.state
    const move = (Math.random() > 0.5) ? -1 : 1
    let newCoords
    if (Math.random() > 0.5) { // Move in the x direction
      console.log(`Attempting to move ${move} in X Direction`)
      const newX = this.canMove(currentX + move) ? currentX + move : currentX
      newCoords = {
        currentX: newX,
        currentY
      }
    } else { // Move in the y direction
      console.log(`Attempting to move ${move} in Y Direction`)
      const newY = this.canMove(currentY + move) ? currentY + move : currentY
      newCoords = {
        currentX,
        currentY: newY
      }
    }
    return newCoords
  }

  handleSliderChange = (event) => {
    this.setState({ speed: event.target.value });
  }

  render() {
    return (
      <div className="container">
        {this.grid.map((row) => {
          return (
            <div key={row} className="grid-row">
              {this.grid.map((col) => {
                return <div key={`${row}${col}`} className={`grid-block ${this.isGoalBlock(row, col) ? 'goalBlock' : ''} ${this.isCurrentBlock(row, col) ? 'currentBlock' : ''}`}></div>
              })}
            </div>
          )
        })}
        <div>Moves: {this.state.moveCount}</div>
        <div>Speed:
          <input type="range" min="0.5" max="10.5" onChange={this.handleSliderChange} value={this.state.speed}></input>
        </div>
        <div className='buttonContainer'>
          
          <button onClick={() => window.location.reload(true)}>Reset</button>
          <button onClick={this.startRandomSearch}>Randomly search</button>
          <button onClick={this.startRLSearch}>Search using reinforced learning</button>
        
        </div>
      </div>
    )
  }
}

export default App;
