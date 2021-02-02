// @flow
import React from 'react'
import { Input, Icon } from 'antd';

class EditableCell extends React.Component {
  state = {
    value: this.props.value || '',
    editable: false,
    disabled: this.props.disabled,
    isRed: this.props.isRed,
  }

  componentWillReceiveProps(nextProps) {
    this.state.value !== nextProps.value && this.setState({
      value: nextProps.value,
    })
    this.state.disabled !== nextProps.disabled && this.setState({
      disabled: nextProps.disabled,
    })
    this.state.isRed !== nextProps.isRed && this.setState({
      isRed: nextProps.isRed,
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
    const { value, editable, disabled, isRed } = this.state;
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
            <div style={{ whiteSpace: 'nowrap', color: isRed ? 'red' : '#000' }} className="editable-cell-text-wrapper" onDoubleClick={disabled ? null : this.edit} >
              {value || '-'}
            </div>
        }
      </div>
    );
  }
}
export default EditableCell
