// watchify -t reactify docs/demo/index.jsx -o docs/demo/bundle.js -v -x react

'use strict';

var React = require('react');
var CodeMirror = require('react-code-mirror');
require('codemirror/mode/javascript/javascript');
var transform = require('../../transform').transform;
var beautify = require('js-beautify');
//var to5 = require('6to5-core').transform;

window._f = require('../../assert');
window.React = React;

var defaultValue = document.getElementById('example').innerText;

var App = React.createClass({

  getInitialState: function () {
    return {
      value: defaultValue,
      assertions: true,
      harmony: false,
      stripTypes: false,
      beautify: true,
      error: null
    };
  },

  compile: function (value, options) {
    options = options || this.state;
    var code = value;
    try {
      // flowcheck
      if (options.assertions) {
        code = transform(code, {
          skipImport: options.skipImport
        });
      }
      // harmony
      /*
      code = to5(code, {
        stripTypes: options.stripTypes
      }).code;
      */
      code = JSXTransformer.transform(code, {
        harmony: options.harmony,
        stripTypes: options.stripTypes
      }).code;
      // beautify
      if (options.beautify) {
        code = beautify(code, {
          indent_size: 2
        });
      }
    } catch (e) {
      code = e.message;
    }
    return code;
  },

  onSourceChange: function (evt) {
    this.setState({
      value: evt.target.value,
      error: null
    });
  },

  onAssertionsChange: function (evt) {
    this.setState({assertions: evt.target.checked});
  },

  onHarmonyChange: function (evt) {
    this.setState({harmony: evt.target.checked});
  },

  onStripTypesChange: function (evt) {
    this.setState({stripTypes: evt.target.checked});
  },

  onBeautifyChange: function (evt) {
    this.setState({beautify: evt.target.checked});
  },

  run: function () {
    try {
      var code = this.compile(this.state.value, {
        assertions: true,
        harmony: true,
        stripTypes: true,
        skipImport: true
      });
      eval(code);
    } catch (e) {
      console.error(e.message);
      this.setState({error: e.message});
    }
  },

  render: function () {
    var code = this.compile(this.state.value);
    var alert = this.state.error ? (
      <div className="alert alert-danger">
        {this.state.error}
      </div>
    ) : null;
    return (
      <div className="row">
        <div className="col-md-6">
          <p><b>Source</b> (live code editor)</p>
          <div className="form-group">
            <CodeMirror
              tabSize={2}
              style={{border: '1px solid #F6E4CC'}}
              textAreaClassName={['form-control']}
              mode="javascript"
              value={this.state.value}
              onChange={this.onSourceChange} />
          </div>
          <p><b>React preview</b></p>
          <p>use <code>React.render(..., preview);</code></p>
          <div id="preview" style={{border: '1px solid #F6E4CC', padding: '20px', marginBottom: '20px'}}></div>
        </div>
        <div className="col-md-6">
          <p><b>Output</b></p>
          <div className="form-group">
            <CodeMirror
              tabSize={2}
              readOnly={true}
              style={{border: '1px solid #F6E4CC'}}
              textAreaClassName={['form-control']}
              mode="javascript"
              value={code}
              smartIndent={false} />
          </div>
          <div className="form-group">
            <label className="checkbox-inline">
              <input type="checkbox" id="assertions" checked={this.state.assertions} onChange={this.onAssertionsChange} /> assertions
            </label>
            <label className="checkbox-inline">
              <input type="checkbox" id="harmony" checked={this.state.harmony} onChange={this.onHarmonyChange} /> harmony
            </label>
            <label className="checkbox-inline">
              <input type="checkbox" id="stripTypes" checked={this.state.stripTypes} onChange={this.onStripTypesChange} /> stripTypes
            </label>
            <label className="checkbox-inline">
              <input type="checkbox" id="beautify" checked={this.state.beautify} onChange={this.onBeautifyChange} /> beautify
            </label>
          </div>
          <div className="form-group">
            <button className="btn btn-danger" onClick={this.run}>Run</button>
            <p>Output to the console, when an assert fails the debugger kicks in</p>
          </div>
          <div className="form-group">
            {alert}
          </div>
        </div>
      </div>
    );
  }

});

React.render(<App />, document.getElementById('app'));