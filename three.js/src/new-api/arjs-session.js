var ARjs = ARjs || {}

/**
 * define a ARjs.Session
 * 
 * @param {Object} parameters - parameters for this session
 */
ARjs.Session = function(parameters){
	var _this = this
	// handle default parameters
	this.parameters = {
		renderer: null,
		camera: null,
		scene: null,
		sourceParameters: {},
		contextParameters: {},
	}
	
	this.signals = {
		sourceReady : new signals.Signal(),
		contextInitialized: new signals.Signal(),
	}

	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.Session: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.Session: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}
	// sanity check
	console.assert(this.parameters.renderer instanceof THREE.WebGLRenderer)
	console.assert(this.parameters.camera instanceof THREE.Camera)
	console.assert(this.parameters.scene instanceof THREE.Scene)
	

	// backward emulation
	Object.defineProperty(this, 'renderer', {get: function(){
		console.warn('use .parameters.renderer renderer')
		return this.parameters.renderer;
	}});
	Object.defineProperty(this, 'camera', {get: function(){
		console.warn('use .parameters.camera instead')
		return this.parameters.camera;
	}});
	Object.defineProperty(this, 'scene', {get: function(){
		console.warn('use .parameters.scene instead')
		return this.parameters.scene;
	}});

	
	// log the version
	console.log('AR.js', ARjs.Context.REVISION, '- trackingBackend:', parameters.contextParameters.trackingBackend)

	//////////////////////////////////////////////////////////////////////////////
	//		init arSource
	//////////////////////////////////////////////////////////////////////////////
	var arSource = _this.arSource = new ARjs.Source(parameters.sourceParameters)

	arSource.init(function onReady(){
		arSource.onResize(arContext, _this.parameters.renderer, _this.parameters.camera)

		_this.signals.sourceReady.dispatch()
	})
	
	// handle resize
	this.onResize = function() {
        arSource.onResize(arContext, _this.parameters.renderer, _this.parameters.camera)
    };
	window.addEventListener('resize', this.onResize);
	
	//////////////////////////////////////////////////////////////////////////////
	//		init arContext
	//////////////////////////////////////////////////////////////////////////////

	// create atToolkitContext
	var arContext = _this.arContext = new ARjs.Context(parameters.contextParameters)
	
	// initialize it
	_this.arContext.init()
	
	arContext.addEventListener('initialized', function(event){
		arSource.onResize(arContext, _this.parameters.renderer, _this.parameters.camera)
		
		_this.signals.contextInitialized.dispatch()
	})
	
	//////////////////////////////////////////////////////////////////////////////
	//		update function
	//////////////////////////////////////////////////////////////////////////////
	// update artoolkit on every frame
	this.update = function(){
		if( arSource.ready === false )	return
		
		arContext.update( arSource.domElement )
	}
}

ARjs.Session.prototype.onResize = function () {
	this.arSource.onResize(this.arContext, this.parameters.renderer, this.parameters.camera)	
};

ARjs.Session.prototype.dispose = function () {
    window.removeEventListener('resize', this.onResize);
    this.arContext.arController.dispose();
    this.parameters.renderer.dispose();
    this.parameters = null;
    this.signals = null;
    this.arSource = false;
};