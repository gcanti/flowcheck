'use strict';

var React = require('react');
var CodeMirror = require('react-code-mirror');
require('codemirror/mode/javascript/javascript');
var transform = require('../../transform');
var beautify = require('js-beautify');

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
    var code = value;
    try {
      // flowcheck
      if (this.state.assertions) {
        code = transform(code);
      }
      // jsx
      code = JSXTransformer.transform(code, options || this.state).code;
      // beautify
      if (this.state.beautify) {
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
    this.setState({value: evt.target.value});
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
    eval(this.compile(this.state.value, {
      harmony: true,
      stripTypes: true
    }));
  },

  render: function () {
    var code = this.compile(this.state.value);
    var alert = this.state.error ? (
      <div className="alert alert-danger">
        {this.state.error}
      </div>
    ) : null;
    return (
      <div className="container">
        <div className="col-md-12">
          <h1><a href="https://github.com/gcanti/flowcheck">flowcheck</a> compiler</h1>
          <p className="lead">Runtime type checking for Flow and TypeScript </p>
        </div>
        <div className="col-md-5">
          <p><b>Source</b></p>
          <div className="form-group">
            <CodeMirror
              tabSize={2}
              style={{border: '1px solid #F6E4CC'}}
              textAreaClassName={['form-control']}
              mode="javascript"
              value={this.state.value}
              onChange={this.onSourceChange} />
          </div>
        </div>
        <div className="col-md-7">
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
            <button className="btn btn-primary" onClick={this.run}>Run (output to the console)</button>
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