//To do:
/*
	3.  High level recurring update interface
	4.  Implement GetSetMediaTrackInfo interface
*/
'use strict';
abstract class HardwareComms
{
	//Public Interface//
	/**
	* @param {number} minUpdate is the smallest time, in ms, that ReaperComms allows updates to be requested from Reaper.  Ignored if the object has already been built.
	* @param {number} autostart determines wether the comms with Reaper should automatically start at the end of initialization or if it will be started manually later.  Ignored if the object has already been built.
	*/
	constructor(minUpdate = 1000/30)
	{
		//Internal variables
		this.g_wwr_timer_freq = minUpdate;
		this.g_wwr_req_list = "";
		this.g_wwr_req_recur = new Array();
		this.#observers = new Observable();
		this.#running = 0;
	}
	
	/**
	* Getter.  Returns a flag indicating whether comms is communicating or not.
	*/
	get recurringMessagesRunning()
	{
		return this.#running;
	}
	
	/**
	* Starts communicating if not already running.
	*/
	startRecurringMessages()
	{
		if (!this.#running)
		{
			this.#lastSendTime = Date.now()-1;
			this.#udpateRecieved = 1;
			this.#running = 1;
			this.#attemptingSend = 0;
			this.#runInterval = setInterval(() => {this.wwr_run_update();}, this.g_wwr_timer_freq);
		}
	}
	
	/**
	* Stops communicating for updates if running.
	*/
	stopRecurringMessages()
	{
		if (this.running)
		{
			this.running = 0;
			clearInterval(this.#runInterval);
		}
	}
	
	/**
	* Getter.  Returns the min update time of the object in ms.
	*/
	get minUpdateTime()
	{
		return this.#minUpdateTime;
	}
	
	/**
	* This function takes in a function, registers it as a listener, and invokes it whenever ReaperComms gets an update from Reaper.
	* @param {Object} listener is a function that is invoked whenever the ReaperComm gets an update.
	*/
	registerListener(listener)
	{
		this.observers.registerListener(listener);
	}
	
	/**
	* This function unregisters a previously registered function as a listener.
	* @param {Object} listener is a function that needs to be removed as a listener.
	*/
	unregisterListner(listener)
	{
		this.observers.unregisterListner(listener);
	}

	/**
	* This function sends a command, or series of commands separated by a semicolon, to Reaper once.  To send an update regularly use wwr_req_recur.
	* This is a low-level communication function.  For ease use one of the other high-level communication functions documented below.
	* @param {Object} command is a string or numeric command(s) to be sent to Reaper.
	*/
	sendMessage(command) 
	{
		//Next we add if it's not an empty command.
		if (name != "")
			this.#oneOffCommands += command;
	}
	
	/**
	* This function sends a command, or series of commands separated by a semicolon, to Reaper every few miliseconds, as specified by the interval parameter
	* @param {string} command is a string or numeric command(s) to be sent to Reaper regularly.
	* @param {number} interval is the number of miliseconds between each send of the command.  Minimum time is whatever the internal ReaperComms minimum was set to in the constructor.
	*/
	addRecurringMessage(command, interval=this.#minUpdateTime)
	{
		//we add if only if it isn't in our command and not an empty command.
		if (command != "")
		{
			var found = 0;
			var l = this.#recurringCommands.length;
			for (var i=0; i < l; ++i)
			{
				if (interval == this.#recurringCommands[i][1])
				{
					clearInterval(this.#recurringCommands[i][2])
					command += this.#recurringCommands[i][0];
					this.#recurringCommands[i][0] = command;
					this.#recurringCommands[i][2] = 0;
					found = 1;
					break;
				}
			}
			
			if (!found)
			{
				this.#recurringCommands.push([command, interval, 0]); 
			}
		}
	}
	
	/**
	* This function takes in a command, or series of commands separated by a semicolon, previously registered for regular sending to Reaper and removes it from the recurring communication list.
	* @param {Object} command is a string or numeric command(s) to be sent to be removed.
	*/
	removeRecurringMessage(command) 
	{
		//Let's see if we can find said request
		if(command != "")
		{
			for (var i=0; i < this.#recurringCommands.length; ++i) 
			{
				//If we can let's get rid of it.
				var cmd = this.#recurringCommands[i][0];
				if (cmd.indexOf(command) != -1) 
				{
					clearInterval(this.#recurringCommands[i][2]);
					cmd = cmd.replace(command, "");
					
					if (cmd != "")
					{
						this.#recurringCommands[i][0] = cmd;
						this.#recurringCommands[i][2] = 0;
					}
					else
						this.#recurringCommands.splice(i,1);
				}
			}
		}
	}




	//Private Interface//
	wwr_run_update()
	{
		var time = Date.now();
		if (!this.attemptingSend && this.running && (this.udpateRecieved || (time - this.lastSendTime) > 3000))
		{
			this.attemptingSend = 1;
			var str = "";
			this.lastSendTime = time;
			
			if (this.g_wwr_req_list != "")
				str = this.g_wwr_req_list;
			
			for (var x=0; x<this.g_wwr_req_recur.length; x++)
			{
				if (this.g_wwr_req_recur[x][2]+this.g_wwr_req_recur[x][1] <= time)
				{
					str += this.g_wwr_req_recur[x][0];
					this.g_wwr_req_recur[x][2] = time;
				}
			}
			
			if (str != "")
			{
				this.g_wwr_req.open("GET","/_/" + str, true);
				this.udpateRecieved = 0;
				this.g_wwr_req.send(null);
				this.g_wwr_req_list = "";
			}
			this.attemptingSend = 0;
		}
	}
	
	//Called whenever there's an update from Reaper.
	handleResponse()
	{
		if (this.g_wwr_req.readyState==4) 
		{
			this.udpateRecieved = 1;
			if (this.g_wwr_req.responseText != "") 
			{
				this.commandCollection.parseCommands(this.g_wwr_req.responseText);
				this.observers.notifyListeners(this.immCommandCollection);
				this.updateReceived = 1;
				
				//If it took more than the refresh time to get this response, we should manually update to keep the response smooth.
				this.wwr_run_update();
			}
        }
    }
	
	#address;
	#timeout;
	#recurringCommands;
	#callback;
	#minUpdateTime;
	#observers;
	#running;
	#lastSendTime;
	#runInterval;
	#attemptingSend;
	#oneOffCommands;
};

