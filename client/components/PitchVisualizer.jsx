import React from 'react';

export default class PitchVisualizer extends React.Component {
  constructor() {
    super();
    this.state = {
      score:0,
      perfect:0
    }
    this.newScore = 0;
    this.newPerfect = 0;
  }

  componentDidMount() {
    var socket = io('http://localhost:8000');
    var player = 'player2';
    socket.on('playerNote', function(data) {
      this.createNotes(data.data, data.songData, player);
    }.bind(this));
    var karaokeInput = document.getElementById('karaokeInput');
    karaokeInput.value = 1;
    var vocalsInput = document.getElementById('vocalsInput');
    vocalsInput.value = 0;

    // Initializes the variables that the pitch detector and visualizer
    // will need to use (see scripts/pitchDetector.js)

    audioContext = new AudioContext();

    detectorElem = document.getElementById( 'detector' );
    canvasElem = document.getElementById( 'output' );
    DEBUGCANVAS = document.getElementById( 'waveform' );

    if (DEBUGCANVAS) {
      waveCanvas = DEBUGCANVAS.getContext('2d');
      waveCanvas.strokeStyle = 'black';
      waveCanvas.lineWidth = 1;
    }

    pitchElem = document.getElementById( 'pitch' );
    noteElem = document.getElementById( 'note' );
    detuneElem = document.getElementById( 'detune' );
    detuneAmount = document.getElementById( 'detune_amt' );

    // Draw the graphs for the first song
    pitchGraph = d3.select('.pitchGraph').append('svg')
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .attr('class', 'songGraph');

    this.drawSongGraph( this.props.selectedData );
  }

  componentWillUpdate() {
    this.stopUserAudio();
    document.getElementById('.songGraph');

    // Refresh graph
    d3.selectAll('svg > *').remove();
    this.drawSongGraph( this.props.selectedData );
  }

  drawSongGraph( data ) {
    var xScale = d3.scaleLinear()
      .domain( [0, data.length] )
      .range( [0, svgWidth] );
    var yScale = d3.scaleLinear()
      .domain( [50, 120] )
      .range( [svgHeight, 0] );

    var notes = pitchGraph.selectAll('rect')
      .data( data, function(d) {
        return d.id;
      } );

    pitchGraph.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'white')
      .attr('fill-opacity', 0.5);

    // ENTER
    notes.enter()
      .append('image')
      .attr("xlink:href", "../baseNote.png")
      .attr("class", "music")
      .style('opacity', 0.5)
      .attr('x', function(d, i) {
        return Math.floor(xScale(i));
      })
      .attr('y', function(d) {
        return yScale(d.value);
      })
      .attr('width', 50)
      .attr('height', 50)
      .attr('fill', '#4DB6AC')
      .attr('id', function(d) {
        return d.id;
      });

    // UPDATE
    notes
      .transition()
      .attr("xlink:href", "../baseNote.png")
      .attr("class", "music")
      .style('opacity', 0.5)
      .attr('x', function(d, i) {
        return Math.floor(xScale(i));
      })
      .attr('y', function(d) {
        return yScale(d.value);
      })
      .attr('width', 50)
      .attr('height', 50)
      .attr('fill', '#4DB6AC')
      .attr('id', function(d) {
        return d.id;
      });

    // EXIT
    notes
      .exit()
      .remove();
  }

  stopUserAudio() {
    if (localStream) {
      localStream.getAudioTracks()[0].stop( 0 );
    }

    localStream = null;

    // End pitch detection/visualization processes
    clearInterval( updatePitchID );
    clearInterval( drawUserGraphID );

    // Refresh user's avgNoteArray
    avgNoteArray = [];
  }

  createNotes  (data, songData, player) {
    var xScale = d3.scaleLinear()
      .domain( [0, this.props.selectedData.length] )
      .range( [0, svgWidth] );
    var yScale = d3.scaleLinear()
      .domain( [50, 120] )
      .range( [svgHeight, 0] );

    var notes = d3.select('.songGraph').selectAll('image .user')
      .data( data, function( d ) {
        return d.id;
      });

    // var lineFunction = d3.svg.line()
    //  .x(function(d) { return xScale(d.id) + (svgWidth / that.props.selectedData.length); })
    //  .y(function(d) { return yScale(d.value); })
    //  .interpolate("linear");

    // ENTER
    // userPitchGraph
    //   .append('path')
    //   .attr("d", lineFunction(data))
    //   .attr("stroke", "blue")
    //   .attr("stroke-width", 2)
    //   .attr("fill", "none")
    notes
      .enter()
      .append('image')
      .attr("xlink:href", "../" + player + "Note.png")
      .attr("class", "user")
      .attr('x', function(d) {
        return Math.floor(xScale(d.id) + (svgWidth / this.props.selectedData.length));
      }.bind(this))
      .attr('y', function(d) {
        return yScale(d.value);
      })
      // .attr('rx', (svgWidth / that.props.selectedData.length) * 1.5)
      // .attr('r', 5)
      // .attr('fill', 'yellow')
      .attr('height', 50)
      .attr('width', 50)
      .attr('id', function(d) {
        return d.id;
      });

    // UPDATE
    //   .attr("d", lineFunction(d))
    //   .attr("stroke", "blue")
    //   .attr("stroke-width", 2)
    //   .attr("fill", "none")
    notes
      .transition()
      .attr("xlink:href", "../" + player + "Note.png")
      .attr("class", "user")
      .attr('x', function(d) {
        return Math.floor(xScale(d.id) + (svgWidth / songData.length));
      })
      .attr('y', function(d) {
        return yScale(d.value);
      })
      .attr('height', 50)
      .attr('width', 50)
      // .attr('rx', (svgWidth / that.props.selectedData.length) * 1.5)
      // .attr('r', 5)
      // .attr('fill', 'red')
      .attr('id', function(d) {
        return d.id;
      });

    // EXIT
    notes
      .exit()
      .remove();
  }

  updateScoreBoard(data, songData) {
    var xScale = d3.scaleLinear()
      .domain( [0, this.props.selectedData.length] )
      .range( [0, svgWidth] );
    var yScale = d3.scaleLinear()
      .domain( [50, 120] )
      .range( [svgHeight, 0] );

    var currentX = Math.floor(xScale(data[data.length - 1].id) + (svgWidth / this.props.selectedData.length));
    var otherNote = d3.select('.songGraph').selectAll('image')
      .filter(function(d) {
        return Math.floor(xScale(d.id) + (svgWidth / this.props.selectedData.length)) === currentX;
      }.bind(this));
    if( otherNote.size() ) {
      var difference = Math.abs(otherNote.attr('y') - yScale(data[data.length - 1].value));
      if ( difference < 30 ) {
        console.log('Perfect');
        this.newScore += 3 + this.newPerfect * 1;
        this.newPerfect++;
        console.log(this.newScore);
      } else {
        this.newPerfect = 0;
        console.log(this.newScore)
      }
      //this.setState({
        // score: newScore,
        // perfect: newPerfect
      // })
    }
  }

  toggleLiveInput() {

    if (localStream === null) {
      getUserAudio();
    } else {
      this.stopUserAudio();
    }
    var player = 'player1'
    var drawUserGraph = function( data, songData ) {
      this.createNotes(data, songData, player);
    }.bind(this);

    // Control interval of both note and wave 
    updatePitchID = setInterval(function() {
      updatePitch();
    }, 10000 / 60);

    // Control interval of pitch graph
    drawUserGraphID = setInterval(function() {
      var socket = io('http://localhost:8000');
      getAvgNote( noteArray );
      socket.emit('playerData', {data: avgNoteArray, songData:this.props.selectedData});
      drawUserGraph( avgNoteArray, this.props.selectedData );
      this.updateScoreBoard(avgNoteArray, this.props.selectedData);
    }.bind(this), 2000);
  }

  render() {
    if (this.props.playSong) {
      this.toggleLiveInput();
    } else {
      this.stopUserAudio.apply(this)
    }
    return (
      <div id="pitchdetector">

        <div className="row">
          <div className="col s12 l4">
            <div id="detector" className="vague">
              <div className="pitch"><span id="pitch">--</span>Hz</div>
              <div className="note"><span id="note">--</span></div>
              <div id="detune"><span id="detune_amt">--</span><span id="flat">cents &#9837;</span><span id="sharp">cents &#9839;</span></div>
            </div>
          </div>
          <div className='col s12 l4 audioPlayer'>
            <a className="btn-floating btn-large waves-effect waves-light teal"
                onClick= {() => {this.props.onPlay(); this.toggleLiveInput() }}>
              <i className="material-icons">play_arrow</i>
            </a>
            <a className="btn-floating btn-large waves-effect waves-light teal" onClick={() => {this.props.onPause(); this.stopUserAudio.apply(this)}}><i className="material-icons">pause</i></a>
            <a className="btn-floating btn-large waves-effect waves-light teal" onClick={() => {this.props.onStop(); this.stopUserAudio.apply(this)}}><i className="material-icons">stop</i></a>
            {this.props.audioPlayer}
            <input type="range" id="karaokeInput" min="0" max="1" step="0.1" onChange={this.props.onKaraokeVolumeChange}/>
            <input type="range" id="vocalsInput" min="0" max="1" step="0.1" onChange={this.props.onVocalsVolumeChange}/>
          </div>
          <div className="col s12 l4">
            <div id="remotesVideos" style={{width:'290px'}}></div>
          </div>
        </div>

        <div className="row">
          <div className="col l12 s12">
            <div className="overflow pitchGraph">
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col l4 s4 scoreboard offset-l3">
            <span>Score : { this.state.score }</span>
          </div>
        </div>

      </div>
    );
  }
};
