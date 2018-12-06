class Ghost {
    constructor(scaledTileSize, mazeArray, pacman, name) {
        this.scaledTileSize = scaledTileSize;
        this.mazeArray = mazeArray;
        this.pacman = pacman;
        this.name = name;
        this.animationTarget = document.getElementById(name);

        this.setMovementStats(pacman);
        this.setSpriteAnimationStats();
        this.setStyleMeasurements(scaledTileSize, this.spriteFrames);
        this.setDefaultPosition(scaledTileSize, name);
        this.setSpriteSheet(this.name, this.direction);
    }

    setMovementStats(pacman) {
        this.directions = {
            up: 'up',
            down: 'down',
            left: 'left',
            right: 'right'
        }

        const pacmanSpeed = pacman.velocityPerMs;

        this.slowSpeed = pacmanSpeed * 0.75;
        this.mediumSpeed = pacmanSpeed * 0.90;
        this.fastSpeed = pacmanSpeed * 1.05;

        this.chasedSpeed = pacmanSpeed * 0.5;
        this.tunnelSpeed = pacmanSpeed * 0.5;
        this.eyeSpeed = pacmanSpeed * 3;

        this.velocityPerMs = this.slowSpeed;
        this.desiredDirection = this.directions.left;
        this.direction = this.directions.left;
        this.moving = false;
    }

    setSpriteAnimationStats() {
        this.msBetweenSprites = 250;
        this.msSinceLastSprite = 0;
        this.spriteFrames = 2;
        this.backgroundOffsetPixels = 0;
    }

    setStyleMeasurements(scaledTileSize, spriteFrames) {
        // The ghosts are the size of 2x2 game tiles.
        this.measurement = scaledTileSize * 2;

        this.animationTarget.style.height = `${this.measurement}px`;
        this.animationTarget.style.width = `${this.measurement}px`;
        this.animationTarget.style.backgroundSize = `${this.measurement * spriteFrames}px`;
    }

    setDefaultPosition(scaledTileSize, name) {
        switch(name) {
            case 'blinky':
                this.position = {
                    top: scaledTileSize * 10.5,
                    left: scaledTileSize * 13
                };
                break;
            default:
                break;
        }
        this.oldPosition = Object.assign({}, this.position);
        this.animationTarget.style.top = `${this.position.top}px`;
        this.animationTarget.style.left = `${this.position.left}px`;
    }

    setSpriteSheet(name, direction) {
        this.animationTarget.style.backgroundImage = `url(app/style/graphics/spriteSheets/characters/ghosts/${name}/${name}_${direction}.svg)`;
    }

    getPropertyToChange(direction) {
        switch(direction) {
            case this.directions.up:
            case this.directions.down:
                return 'top';
            default:
                return 'left';
        }
    }

    getVelocity(direction, velocityPerMs) {
        switch(direction) {
            case this.directions.up:
            case this.directions.left:
                return velocityPerMs * -1;
            default:
                return velocityPerMs;
        }
    }

    calculateNewDrawValue(interp, prop) {
        return this.oldPosition[prop] + (this.position[prop] - this.oldPosition[prop]) * interp;
    }

    determineGridPosition(currentPosition) {
        return {
            x : (currentPosition.left / this.scaledTileSize) + 0.5,
            y : (currentPosition.top / this.scaledTileSize) + 0.5
        };
    }

    determineRoundingFunction(direction) {
        switch(direction) {
            case this.directions.up:
            case this.directions.left:
                return Math.floor;
            default:
                return Math.ceil;
        } 
    }

    changingGridPosition(oldPosition, newPosition) {
        return (
            Math.floor(oldPosition.x) !== Math.floor(newPosition.x) ||
            Math.floor(oldPosition.y) !== Math.floor(newPosition.y)
        );
    }

    snapToGrid(position, direction, scaledTileSize) {
        let newPosition = Object.assign({}, position);
        let roundingFunction = this.determineRoundingFunction(direction);

        switch(direction) {
            case this.directions.up:
            case this.directions.down:
                newPosition.y = roundingFunction(newPosition.y);
                break;
            default:
                newPosition.x = roundingFunction(newPosition.x);
                break;
        }

        return {
            top: (newPosition.y - 0.5) * scaledTileSize,
            left: (newPosition.x - 0.5) * scaledTileSize
        };
    }

    getOppositeDirection(direction, directions) {
        switch(direction) {
            case directions.up:
                return directions.down;
            case directions.down:
                return directions.up;
            case directions.left:
                return directions.right;
            default:
                return directions.left;
        }
    }

    getTile(mazeArray, y, x) {
        let tile = false;

        if (mazeArray[y] && mazeArray[y][x]) {
            tile = mazeArray[y][x];
        }

        return tile;
    }

    determinePossibleMoves(gridPosition, direction, mazeArray) {
        const x = gridPosition.x;
        const y = gridPosition.y;

        const possibleMoves = {
            up: this.getTile(mazeArray, y - 1, x),
            down: this.getTile(mazeArray, y + 1, x),
            left: this.getTile(mazeArray, y, x - 1),
            right: this.getTile(mazeArray, y, x + 1),
        };

        possibleMoves[this.getOppositeDirection(direction, this.directions)] = false;

        for (let tile in possibleMoves) {
            if (possibleMoves[tile] === 'X' || possibleMoves[tile] === false) {
                delete possibleMoves[tile];
            }
        }
        
        return possibleMoves;
    }

    determineDirection(gridPosition, pacmanGridPosition, direction, mazeArray) {
        const possibleMoves = this.determinePossibleMoves(gridPosition, direction, mazeArray);
    }

    draw(interp) {
        this.animationTarget.style['top'] = `${this.calculateNewDrawValue(interp, 'top')}px`;
        this.animationTarget.style['left'] = `${this.calculateNewDrawValue(interp, 'left')}px`;

        if (this.msSinceLastSprite > this.msBetweenSprites && this.moving) {
            this.msSinceLastSprite = 0;

            this.animationTarget.style.backgroundPosition = `-${this.backgroundOffsetPixels}px 0px`;
        
            if (this.backgroundOffsetPixels < (this.measurement * (this.spriteFrames - 1))) {
                this.backgroundOffsetPixels = this.backgroundOffsetPixels + this.measurement;
            } else {
                this.backgroundOffsetPixels = 0;
            }
        }
    }

    update(elapsedMs) {
        this.oldPosition = Object.assign({}, this.position);

        if(this.pacman.moving) {
            this.moving = true;
        }

        if (this.moving) {
            const gridPosition = this.determineGridPosition(this.position);

            if (JSON.stringify(this.position) === JSON.stringify(this.snapToGrid(gridPosition, this.direction, this.scaledTileSize))) {
                const pacmanGridPosition = this.determineGridPosition(this.pacman.position);
                this.determineDirection(gridPosition, pacmanGridPosition, this.direction, this.mazeArray);

                this.position[this.getPropertyToChange(this.desiredDirection)] += this.getVelocity(this.desiredDirection, this.velocityPerMs) * elapsedMs;
            } else {
                const newPosition = Object.assign({}, this.position);
                newPosition[this.getPropertyToChange(this.desiredDirection)] += this.getVelocity(this.desiredDirection, this.velocityPerMs) * elapsedMs;
                const newGridPosition = this.determineGridPosition(newPosition, this.mazeArray);
    
                if (this.changingGridPosition(gridPosition, newGridPosition)) {
                    this.position = this.snapToGrid(gridPosition, this.direction, this.scaledTileSize);
                } else {
                    this.position = newPosition;
                }
            }
        }

        this.msSinceLastSprite += elapsedMs;
    }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Ghost;
}