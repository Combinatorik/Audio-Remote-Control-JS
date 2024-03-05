'use strict';
/**
* The Observable object maintains a list of observers and sends out an update to all of them when requested.
*/
class Observable
{
	#observers;
	
	constructor()
	{
		this.#observers = [];
	}
	
	/**
	* This function takes in a function, registers it as a listener, and invokes it whenever this object's internal state is updated.
	* @param {Object} obj is a function that will be added to the list of functions to be notified on update.
	*/
	registerListener(obj)
	{
		var found = 0;
		if (obj != null)
		{
			var l = this.#observers.length;
			for (var i = 0; i < l; i++)
			{
				if (this.#observers[i] == obj)
				{
					found = 1;
					break;
				}
			}
			
			if (!found)
				this.#observers.push(obj);
		}
	}
	
	/**
	* This function unregisters a previously registered function as a listener.
	* @param {Object} obj is a function that will be removed from the list of functions to be notified on update.
	*/
	unregisterListner(obj)
	{
		var found = 0;
		var i;
		if (obj != null)
		{
			var l = this.#observers.length;
			for (i = 0; i < l; i++)
			{
				if (this.#observers[i] == obj)
				{
					found = 1;
					break;
				}
			}
			
			if (found)
				this.#observers.splice(i,1);
		}
	}
	
	/**
	* This function notifies all listeners of a change by sending out an update.  The update can be anything, but listeners need to know what it is so they know what to expect.
	* @param {Object} update is an object containing an update.
	*/
	notifyListeners(update)
	{
		var l = this.#observers.length;
		for (var i = 0; i < l; i++)
			this.#observers[i](update);
	}
};

/**
* The Observer object is an interface that allows obervables to update their listeners.
*/
abstract class Observer
{
	update(ob) {}
};