// @flow
import React from 'react'
import { Input, Icon } from 'antd';

class EditableCell extends React.Component {
  state = {
    value: this.props.value,
    editable: false,
    disabled: this.props.disabled,
  }

  componentWillReceiveProps(nextProps) {
    this.state.value !== nextProps.value && this.setState({
      value: nextProps.value,
    })
    this.state.disabled !== nextProps.disabled && this.setState({
      disabled: nextProps.disabled,
    })
  }

  handleChange = (e) => {
    const value = e.target.value;
    this.setState({ value });
  }
  check = () => {
    this.setState({ editable: false });
    if (this.props.onChange) {
      this.props.onChange(this.state.value);
    }
  }
  edit = () => {
    this.setState({ editable: true }, () => { this.inputComponent.focus() });
  }
  render() {
    const { value, editable, disabled } = this.state;
    return (
      <div className="editable-cell">
        {
          editable ?
            <div className="editable-cell-input-wrapper">
              <Input
                value={value}
                ref={(e) => this.inputComponent = e}
                style={{ width: 80 }}
                onChange={this.handleChange}
                onPressEnter={this.check}
                onBlur={this.check}
              />
            </div>
            :
            <div className="editable-cell-text-wrapper">
              {value || ' '}
              {
                !disabled && <Icon
                type="edit"
                className="editable-cell-icon"
                onClick={this.edit}
              />
              }
            </div>
        }
      </div>
    );
  }
}
export default EditableCell
