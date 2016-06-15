//
// Document Ready, Let's Play
//
var human = 'A';
function startg(){
  human = $('#sel1').val();
  $('#pregame').hide();
  var tic = new Game('#game-container', '#game-template');
  $('#game').show();
}

var Game = function(element, template){

  this.element = $(element);
  this._template = template;

  this.init = function(){
    this.over = false;
    this.moves = 0;
    this._winPiece = [];
    this.startTime = Date.now();
    this.endTime = Date.now(); // reset this latter
    this.Player = [];
    this.Board = null;
    this.activePlayer = 0; // current active player (index of this.players)
    this.updateMovesCount();
    this.maxThemes = 4;
    this.humanPlayer=0;
    if (human=='X') this.humanPlayer=0;
    if (human=='O') this.humanPlayer=1;

    this.choice = '-1'; // Choice that the AI makes

    if (!this.template){
      this.template = $(this._template).html()
      this.element.append(this.template)
      this.bindEvents()

      // store theme in cookie
      var theme = readCookie('game-theme') || 1
      theme = parseInt(theme)
      this.setTheme( theme )
    }
  }

  this.setTheme = function(theme){
    this.theme = theme;
    $('body').attr('class', 'theme-0'+ theme)
    $('#theme span').text( theme )
    createCookie('game-theme', theme, 365)
  }

  this.bindEvents = function(){
    var self = this;

    $('#theme').click(function(e){
      e.preventDefault()
      if (!self.theme) self.theme = 1;
      self.theme++;
      if (self.theme > self.maxThemes) self.theme = 1
      self.setTheme( self.theme )
    })

    $('#restart', this.element).click(function(e){
      e.preventDefault();
      if (self.moves < 1) return;
      self.hideMenu()
      $('td.X, td.O', this.element).addClass('animated zoomOut')
      setTimeout(function(){
        self.restart();
      }, 750);
    });

    // bind input actions
    $('#game tr td', this.element).click(function(el, a, b){
      if(self.over) return;
      var col = $(this).index();
      var row = $(this).closest('tr').index();
      self.move( row +' '+ col );
      if (self.activePlayer != self.humanPlayer){
        self.minimax(self.Board, self.activePlayer, 0, 1-self.humanPlayer);
        var v = self.makeV(self.choice);
        self.move(v);
      }
      self.showMenu()
    });

    $('#game tr td', this.element).hover(function(){
      if(self.over) return;
      $(this).addClass('hover-'+ self.activePlayer);
    }, function(){
      if(self.over) return;
      $(this).removeClass('hover-0 hover-1');
    })

    // reset the td.X|O elements when css animations are done
    $(this.element).on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', 'td.X', function(){
      $(this).attr('class', 'X')
    });

    $(this.element).on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', 'td.O', function(){
      $(this).attr('class', 'O')
    });

  }

  this.start = function(){
    this.hideMenu();
    this.init();
    $('#game tr td').attr('class', '');
    $('#status').removeClass('show');
    // create two players
    this.Player.push( new Player(0) );
    this.Player.push( new Player(1) );
    this.Board = new Board();
    this.Board.update();
    // set this.startTime
    this.startTime = Date.now();

    if(human=='O'){
		if (this.activePlayer != this.humanPlayer){
	        var choices = [0,2,3,6,8];
	        var v = this.makeV(choices[Math.floor(Math.random()*choices.length)]);
	        this.move(v);
	      }
    }

    // this.timer();
  };

  this.showMenu = function(){
    $('#menu').attr('class', '')
  }

  this.hideMenu = function(){
    $('#menu').attr('class', 'hidden')
  }

  this.restart = function(){
    clearInterval( this.timerHandle );
    this.start();
  }


  this.timer = function(){
    var self = this;
    var then = self.startTime;
    var format = function(now, then){
      return Date.create(then).relative();
    };
    this.timerHandle = setInterval(function(){
      var now = Date.now();
      $('#time').text( format(now, then) );
    }, 500);
  };


  /**
   * Parse a users move input string, e.g. '1 2'
   * 
   * @param  {string} v An input string representing a move in the format 'row col'
   * @return {object}   row, col, and index (the index on the game board)
   */
  this.parseInput = function(v){
    v = v.split(' ');
    var pos = Number(v[1]);
    if(v[0] == 1) pos = (pos+3);
    if(v[0] == 2) pos = (pos+6);
    return {
      row: v[0],
      col: v[1],
      index: pos
    };
  };

  /**
   * Attempt to make a move, basically is it 'possible'
   * 
   * @param  {number} input the index to move to
   * @return {boolean}      
   */
  this.tryMove = function(input){
    if(this.Board.board[input] == '_') return true;
    return false;
  };

  /**
   * Make a move as the active player
   * 
   * @param  {string} v An input string, eg: '1 1'
   * @return {boolean}   return false if we are unable to make the move
   */

   this.makeV = function(choice){
      if(choice==0) return '0 0';
      if(choice==1) return '0 1';
      if(choice==2) return '0 2';
      if(choice==3) return '1 0';
      if(choice==4) return '1 1';
      if(choice==5) return '1 2';
      if(choice==6) return '2 0';
      if(choice==7) return '2 1';
      if(choice==8) return '2 2';
   }

  this.move = function(v){
    //If computer's turn, use AI to get move

    var Player = this.Player[ this.activePlayer ];
    v = this.parseInput(v);
    if(!this.tryMove(v.index)) return false;

    Player.moves.push( v.index );
    this.moves++;
    this.Board.board[v.index] = Player.symbol;
    this.activePlayer = (Player._id) ? 0 : 1; // inverse of Player._id
    // update our board.
    this.Board.update();

    this.updateMovesCount();

    // a player has won!
    if(this.hasWon(Player)){
      this.gameOver(Player);
      return true;
    }

    // draw!
    if(this.moves >= 9) this.gameOver(null)

    return true;
  };

  this.gameOver = function(Player){
    if (!Player){
      $('td.X, td.O', this.element).addClass('animated swing')
      return $('#status').text('It\'s a Draw!').addClass('show');
    }

    // only animate the winning pieces!
    var elements = '';
    for(var i=0; i<this._winPiece.length; i++){
      var p = this._winPiece[i]
      if (p < 3){
        elements += 'tr:eq(0) td:eq('+ p +'),';
      } else if( p < 6){
        elements += 'tr:eq(1) td:eq('+ (p-3) +'),';
      } else {
        elements += 'tr:eq(2) td:eq('+ (p-6) +'),';
      }
    }
    elements.slice(0, - 1); // trim last character

    var x = $( elements ).addClass('animated rubberBand')

    $('#status').text('Player '+ Player.symbol +' Wins!').addClass('show');
    this.over = true;

  }

  /**
   * Check if the player has won
   * @param  {Player}  Player the player
   * @return {Boolean}
   */
  this.hasWon = function(Player){
    var won = false;
    var wins = Player.moves.join(' ');
    var self = this;

    this.Board.wins.each(function(n){
      if(wins.has(n[0]) && wins.has(n[1]) && wins.has(n[2])){
        won = true;
        self._winPiece = n;
        return true;
      }
    });
    return won;
  };

  this.updateMovesCount = function(){
    $('#time').text('Moves: '+ this.moves );
  }

  /* ALL AI FUNCTIONS START HERE */

  // Checks if player has won given a particular board
  this.checkWin = function(playerIndex,board){
    var player = playerIndex? 'O' : 'X';
    var moves = [];
    for(var i in board.board){
      if(board.board[i]==player){
        moves.push(i);
      }
    }
    var won = false;
    var wins = moves.join(' ');
    board.wins.each(function(n){
      if(wins.has(n[0]) && wins.has(n[1]) && wins.has(n[2])){
        won = true;
        return true;
      }
    });
    return won;
  }

  //Evaluation function for MINIMAX
  this.evaluate = function(playerIndex,board,depth){
    if (this.checkWin(playerIndex,board)){
      return 10+depth;
    }
    if (this.checkWin(1-playerIndex,board)){
      return -10+depth;
    }
    return 0;
  }

  // Checks if the game is over or not with given board
  this.checkOver = function(board){
    //Check for player X or O
    if( this.checkWin(0,board) || this.checkWin(1,board) ) return true;
    // Check for draw
    var ctr=0;
    for(var i in board.board){
      if (board.board[i]=='_'){
        ctr=1;
      }
    }
    if(ctr==0){
      return true;
    }
    // Else game is not over
    return false;
  }

  // AI function that determines next best move
  this.minimax = function(board, curplay, depth,move){
    if (this.checkOver(board)){
      return this.evaluate(this.activePlayer,board,depth);
    }

    var myMove = move?'O':'X';

    var curScore;
    if(curplay==this.activePlayer)
    	curScore = -10000;
    else
    	curScore = 10000;

    var scores = [];
    var moves = [];

    for(var i in board.board){
      // Possible next state of game
      if(board.board[i] == '_'){
        var nextboard = new Board();
        nextboard.board =  board.board.slice(0);
        nextboard.board[i] = myMove;
        
        var nextScore = this.minimax(nextboard,1-curplay, depth+1,1-move);
        scores.push(nextScore);
        moves.push(i);

        if(curplay==this.activePlayer){
        	if(nextScore > curScore){
        		curScore = nextScore;
        	}
        }

        else{
        	if(nextScore < curScore){
        		curScore = nextScore;
        	}
        }
      }
    }

    var ind;
    var max = -1000;
    for(var i in scores){
    	if(scores[i]>max){
    		max=scores[i];
    		ind = i;
    	}
    }
    this.choice = moves[ind];

    return curScore;
  }

  //
  // Start the game
  //

  this.start()

};




/**
 * Player Object
 */
var Player = function(id, computer){
  this._id = id;
  this.symbol = (id == 0) ? 'X' : 'O';
  this.computer = (computer) ? computer : true; // default to computer user
  this.moves = [];
};



/**
 * Board Object
 */
var Board = function(){
  // empty board (3x3)
  this.board = [
    '_','_','_',
    '_','_','_',
    '_','_','_'
  ];

  // array of possible win scenarios
  this.wins = [
    [0,1,2], [3,4,5], [6,7,8], [0,3,6],
    [1,4,7], [2,5,8], [0,4,8], [2,4,6]
  ];

  this.update = function(){
    var board = this.board;
    $('#game tr').each(function(x, el){
      $('td', el).each(function(i, td){
        var pos = Number(i);
        if(x == 1) pos = (pos+3);
        if(x == 2) pos = (pos+6);
        var txt = (board[pos] == '_') ? '' : board[pos];
        $(this).html( txt ).addClass( txt );
      });
    });
  };

};

/**
 * Read/Write cookies (http://www.quirksmode.org/js/cookies.html)
 */
function createCookie(name, value, days) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime()+(days*24*60*60*1000));
    var expires = "; expires="+date.toGMTString();
  }
  else var expires = "";
  document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

function eraseCookie(name) {
  createCookie(name,"",-1);
}