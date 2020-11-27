// @flow
import React, { Component } from 'react'
import styles from './Login.css'
import crypto from 'crypto'
import { Input, Form, Button, Icon, message } from 'antd'
const FormItem = Form.Item

class Login extends React.PureComponent {
  constructor (props) {
    super(props)
  }
  state = {
  }

  submitLogin = () => {
    const { form } = this.props
    form.validateFields((err, values) => {
      if (!err) {
        let md5 = crypto.createHash('md5')
        const pwd = window.btoa(md5.update(values.pwd).digest('hex').toUpperCase())
        var urlencoded = new URLSearchParams();
        urlencoded.append("name", values.name);
        urlencoded.append("pwd", pwd);
        fetch(`${__API__}login`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/x-www-form-urlencoded ; charset=UTF-8",
          },
          body: urlencoded,
          redirect: 'follow'
        }).then(res => res.json())
        .then(result => {
          if (result.isSuccess === '1') {
            message.success(result.msg)
            let d = new Date()
            d.setDate(d.getDate() + 1)
            document.cookie = "cookids="+result.cookids+";expires="+d.toGMTString()
            sessionStorage.setItem('username', values.name)
            this.props.history.push('/')
          } else {
            message.destroy()
            message.error(result.msg)
          }
        })
        .catch(error => console.log('error', error));
      }
    })
  }

  render () {
    const { getFieldDecorator } = this.props.form
    return (
        <div className={styles['container']}>
          <div className={styles['login-box']}>
            <div className={styles['logo-box']}>
              <img src="/logo.png" width='225px' height="50px" />
            </div>
            <Form>
              <FormItem>
                {getFieldDecorator('name', {
                  rules: [{
                    required: true, message: '请输入用户名',
                  }],
                })(
                  <Input prefix={<Icon type="user" style={{ fontSize: 16 }} />} style={{ width: '100%', height: 48 }} />
                )}
              </FormItem>
              <FormItem>
                {getFieldDecorator('pwd', {
                  rules: [{
                    required: true, message: '请输入密码',
                  }],
                })(
                  <Input type='password' prefix={<Icon type="lock" style={{ fontSize: 16 }} />} style={{ width: '100%', height: 48 }} />
                )}
              </FormItem>
            </Form>
            <Button onClick={this.submitLogin} style={{ width: '100%', height: 48, marginTop: 40 }} type='primary' >登录</Button>
          </div>
        </div>
    )
  }
}

export default Form.create()(Login)