PlayersList = new Mongo.Collection('players');

Meteor.methods({

    'createPlayer': function(playerNameVar){
    	check(playerNameVar, String);
		var currentUserId = Meteor.userId();
		if (currentUserId){
		      	PlayersList.insert({
	    			name: playerNameVar,
	   				score: 0,
	   				createdBy: currentUserId,
	   				canRoll: true,
	  				});
	        };
    },

    'removePlayer': function(selectedPlayer){
    	check(selectedPlayer, String);
    	var currentUserId = Meteor.userId();
    	if(currentUserId){
        	PlayersList.remove( { _id: selectedPlayer, createdBy: currentUserId });
    	};
    },

    'nextPlayer': function(selectedPlayer){
    	var currentUserId = Meteor.userId();
    	PlayersList.update({_id: selectedPlayer, createdBy: currentUserId}, 
    						{$set: {canRoll: false}});

    	if (!PlayersList.findOne({createdBy: currentUserId, canRoll: true})){
        	PlayersList.update({createdBy: currentUserId}, 
        						{$set: {canRoll: true}}, {multi: true});
        };
    },

    'resetGame': function(){
    	var currentUserId = Meteor.userId();
    	if (currentUserId){
    		PlayersList.update({createdBy: currentUserId}, 
        						{$set: {score: 0}}, {multi: true});
    	}
    },

    'updateScore': function(selectedPlayer){
    	var currentUserId = Meteor.userId();
    	if(currentUserId){

    		var player = PlayersList.findOne({ _id: selectedPlayer, createdBy: currentUserId });
    		var scoreValue = Math.floor((Math.random()* 6) + 1);
    		var newScore = scoreValue + player.score;
    		
    		if (newScore > 100){
    			console.log("Too far ahead!");
    			var diffScore = newScore - 100;
    			newScore = 100 - diffScore;
    		}else if (newScore == 6){
    			console.log("You stepped on a ladder!");
    			newScore = 18;
    		}else if (newScore == 16){
    			console.log("You stepped on a ladder!");
    			newScore = 49;
    		}else if (newScore == 54){
    			console.log("You stepped on a snake!");
    			newScore = 10;
    		}else if (newScore == 89){
    			console.log("You stepped on a snake!");
    			newScore = 40;
    		};
    		
    		if (PlayersList.findOne({score: newScore, createdBy: currentUserId}) != null){
    			console.log("Someone pushed you away!");
    			newScore = 0;
    		};

    		PlayersList.update( { _id: player._id, createdBy: currentUserId },
                            	{ $set: {score: newScore}});
        };
    },
});

if(Meteor.isClient){

	Meteor.subscribe('thePlayers');

    Template.board.helpers ({
		'player': function() {
			var currentUserId = Meteor.userId();
			return PlayersList.find({createdBy: currentUserId}, 
									{});
		},

		'selectedClass': function(){
			var playerId = this._id;
	        var selectedPlayer = Session.get('selectedPlayer');
	        var turnselectedPlayer = PlayersList.findOne({canRoll: true})._id;
	    	if(playerId == selectedPlayer){
	        	return "selected";
	        } else if(playerId == turnselectedPlayer){
	        	return "turn";
	        }else {
	        	return "nothing";
	        };
	    },

	    'selectedPlayer': function(){
	    	var selectedPlayer = Session.get('selectedPlayer');
	    	return PlayersList.findOne({ _id: selectedPlayer });
		},

		'resetButton': function(){
			return PlayersList.findOne({score: 100});
		},

	});

    Template.board.events({
    	'click .player': function(){
    		var playerId = this._id;

    		if (playerId == Session.get('selectedPlayer')){
    			Session.set('selectedPlayer', 'nothing');
    		}else{
    			Session.set('selectedPlayer', playerId);
    		};

    		var selectedPlayer = Session.get('selectedPlayer');
        },


		'click .remove': function(){
   			 var selectedPlayer = Session.get('selectedPlayer');
   			 Meteor.call('removePlayer',selectedPlayer);

		},

		'click .reset': function(){
			Meteor.call('resetGame');
		},
    });

    Template.addPlayerForm.events({
	    'submit form': function(evt){
	    	evt.preventDefault();
	        var playerNameVar = evt.target.playerName.value;
	        if (PlayersList.find().count() < 4){
	        	Meteor.call('createPlayer', playerNameVar);
	        }else{
	        	alert("The maximum number of players have reached!")
	        };
	        evt.target.playerName.value = "";
	    },

	    'click .roll': function(){
	    	if (PlayersList.findOne({score: 100})){
	    		alert("The game has ended!")
	    		
	    	}else if (PlayersList.find().count() < 4 ){
	    		alert("There are insufficient players");

	    	} else{
	    		var currentUserId = Meteor.userId();
	    		var player = PlayersList.findOne({ canRoll: true, createdBy: currentUserId });
	    		Meteor.call('updateScore', player._id);
	    		Meteor.call('nextPlayer', player._id);
	    	};
		},
	});

};

if(Meteor.isServer){
    Meteor.publish('thePlayers', function(){
    	var currentUserId = this.userId;
    	return PlayersList.find({createdBy: currentUserId});
    });
};

