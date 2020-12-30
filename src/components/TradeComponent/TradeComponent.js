// @flow
import { Button, Col, Collapse, DatePicker, Input, Layout, message, Modal, Radio, Row, Select } from 'antd'
import EditableCell from 'components/EditableCell'
import moment from 'moment'
import React from 'react'
import Scrollbars from 'react-custom-scrollbars'
import styles from './TradeComponent.css'
const RadioGroup = Radio.Group
const { Sider, Content, Footer, Header  } = Layout;
const { Option } = Select
const { TextArea } = Input
const { Panel } = Collapse

class TradeComponent extends React.PureComponent {
  constructor (props) {
    super(props)
  }
  state = {
    textValue: '',
    dateValue: moment(),
    operatorData: [],
    structData: [],
    orgData: [],
  }

  componentDidMount () {
    this.getOperator()
  }

  onCellChange = (index, endex, dataIndex) => {
    return (value) => {
      const structData = [...this.state.structData];
      const data = structData[index].data;
      const target = data[endex]
      if (target) {
        if (dataIndex === 'operator') {
          const obj = this.state.operatorData.find(item => item.operator === value)
          target['operatorID'] = obj.operatorID
          target['operator'] = value
        } else if (dataIndex === 'payDay') {
          target[dataIndex] = moment(value).format('YYYY-MM-DD');
        } else if (dataIndex === 'netPrice') {
          const reg = /^(?:[1-9]\d*|0)(?:\.\d+)?$/
          if (value && !reg.test(value)) { 
            message.error('请输入数字')
            return
          }
          if (!target['originalNetPrice']) { 
            target[dataIndex] = value
            return
          }
          if (target['tradDirection'] === '买入') {
            const num = Number(value)*1000 - Number(target['originalNetPrice'])*1000
            if (num < 0) {
              message.error('留费不能为负值')
            } else {
              target['stayFee'] = num.toFixed(1)
              target[dataIndex] = value
            }
          } else {
            const num = Number(target['originalNetPrice'])*1000 - Number(value)*1000
            if (num < 0) {
              message.error('留费不能为负值')
            } else {
              target['stayFee'] = num.toFixed(1)
              target[dataIndex] = value
            }
          }
        } else if (dataIndex === 'stayFee') {
          const reg = /^(?:[1-9]\d*|0)(?:\.\d+)?$/
          if (value && !reg.test(value)) { 
            message.error('请输入数字')
            return
          }
          if (!target['originalNetPrice']) { 
            target[dataIndex] = value
            return
          }
          if (target['tradDirection'] === '买入') {
            target['netPrice'] = ((Number(target['originalNetPrice'])*10000 + Number(value)*10) / 10000).toFixed(4)
            target[dataIndex] = value
          } else {
            if (Number(target['originalNetPrice']) - Number(value) / 1000 < 0) {
              message.error('净价不能为负值')
            } else {
              target['netPrice'] = ((Number(target['originalNetPrice'])*10000 - Number(value)*10) / 10000).toFixed(4)
              target[dataIndex] = value
            }
          }
        } else {
          if (dataIndex === 'tradDirection' && target['originalNetPrice']) {
            if (value === '买入') {
              target['netPrice'] = ((Number(target['originalNetPrice'])*10000 + Number(target['stayFee'])*10) / 10000).toFixed(4)
            } else {
              target['netPrice'] = ((Number(target['originalNetPrice'])*10000 - Number(target['stayFee'])*10) / 10000).toFixed(4)
            }
          }
          if (dataIndex === 'price') {
            if (value === 'ordPrice') {
              target['ordPrice'] = target['netPrice']
              target['netPrice'] = ''
            } else {
              target['netPrice'] = target['ordPrice']
              target['ordPrice'] = ''
            }
          }
          if (dataIndex === 'yieldOption') {
            if (value === 'yield') {
              target['yield'] = target['bnd_yield']
              target['bnd_yield'] = ''
            } else {
              target['bnd_yield'] = target['yield']
              target['yield'] = ''
            }
          }
          target[dataIndex] = value
        }
        this.setState({ structData })
      }
    }
  }

  hasCookie = () => {
    const cookie = document.cookie
    if (cookie.indexOf('cookids=') === -1) {
      message.destroy()
      message.error('登录已过期 ，请重新登录')
      this.props.history.push('/login')
      return
    }
  }

  getOperator = () => {
    fetch(`${__API__}getOperators`, {
      method: 'GET',
      credentials: 'include',
    }).then(res => res.json())
    .then(result => {
      this.setState({
        operatorData: result,
      })
    })
    .catch(error => console.log('error', error));
  }

  getOrgName = (key) => {
    fetch(`${__API__}controller/second/selectOrgNames_Parent?key=${key}`, {
      method: 'GET',
      credentials: 'include',
    }).then(res => res.json())
    .then(result => {
      this.setState({
        orgData: result,
      })
    })
    .catch(error => console.log('error', error));
  }

  fetchOrg = (value) => {
    console.log(value, value.length)
    if(value.length > 1) {
      this.getOrgName(value)
    }
  }

  handleProcess = () => {
    this.hasCookie()
    const { textValue, dateValue } = this.state
    var urlencoded = new URLSearchParams();
    urlencoded.append("input", textValue);
    urlencoded.append("day", moment(dateValue).format('YYYY-MM-DD'));
    fetch(`${__API__}controller/second/sa`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded ; charset=UTF-8",
      },
      body: urlencoded,
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      if (result.success === '1') {
        this.handleProcessData(result.data)
      } else {
        message.destroy()
        message.error(result.msg)
      }
    })
    .catch(error => console.log('error', error));
  }

  handleProcessData = (data) => {
    let { textValue } = this.state
    const _this = this
    if (data.length === 0) {
      return
    }
    let index = data.findIndex(item => item.matchString.indexOf('~') !== -1)
    if (index !== -1) {
      let findItem = data.find(item => item.matchString.indexOf('~') !== -1)
      const radioStyle = {
        display: 'block',
        height: '20px',
        lineHeight: '20px',
      }
      let radioValue = 0
      let newArr = findItem.matchString.split('~').map((etem, endex) => {
        return {
          matchString: etem,
          type: findItem.type,
          key: endex,
        }
      })
      data.map((etem, endex) => {
        if (endex === index) {
          let newText = textValue.slice(etem.start)
          newText = newText.replace(etem.subString, `<span style="color: red;">${etem.subString}</span>`)
          textValue = textValue.slice(0, etem.start) + newText
        }
      })
      Modal.confirm({
        title: '请选择',
        width: 800,
        content: <div>
          <div dangerouslySetInnerHTML={{__html: textValue }} key={index} />
          <p style={{ color: 'red', marginTop: 20 }}>原文标红处匹配多项信息：请选择</p>
          <RadioGroup defaultValue={0} onChange={e => radioValue = e.target.value }>
            {newArr.map(etem => { return <Radio style={radioStyle} key={etem.key} value={etem.key}>{etem.type === '债券名称' ? '【券名】' : '【客户】'} {etem.matchString}</Radio> })}
            <Radio style={radioStyle} value={-1}>标红处无信息</Radio>
          </RadioGroup>
        </div>,
        okText: '确认选择',
        onOk() {
          if (radioValue === -1) {
            data.splice(index, 1)
            _this.handleProcessData(data)
          } else {
            const newObj = findItem
            Object.assign(newObj, newArr[radioValue])
            data.splice(index, 1, newObj)
            _this.handleProcessData(data)
          }
        },
      })
    } else {
      this.structuredByList(data)
    }
  }

  structuredByList = (data) => {
    const _this = this
    fetch(`${__API__}controller/second/structed`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/json ; charset=UTF-8",
      },
      body: JSON.stringify(data),
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      if (result.success === '1') {
        message.destroy()
        message.success('解析成功')
        this.setState({
          structData: result.data,
        })
      } else {
        message.destroy()
        message.error(result.msg)
        this.setState({
          structData: [],
        })
      }
    })
    .catch(error => console.log('error', error));
  }

  changeBtnState = (index, endex, changeState) => {
    const structData = [...this.state.structData];
    const item = structData[index].data;
    const target = item[endex]
    target['changeState'] = changeState
    this.setState({ structData })
  }

  submitBtn = (data, index, endex) => {
    this.changeBtnState(index, endex, true)
    fetch(`${__API__}controller/second/saveData`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/json ; charset=UTF-8",
      },
      body: JSON.stringify([data]),
      redirect: 'follow'
    }).then(res => res.json())
    .then(result => {
      if (result.isSuccess === '1') {
        message.destroy()
        message.success(result.msg)
      } else if(result.isSuccess === '-3') {
        this.changeBtnState(index, endex, false)
        message.destroy()
        message.error(result.msg)
      } else {
        message.destroy()
        message.error(result.msg)
      }
    })
    .catch(error => console.log('error', error));
  }

  render () {
    const { textValue, structData, operatorData, dateValue, orgData } = this.state
    const buyInOut = ['卖出', '买入']
    const requestOption = ['发请求', '发对话', '-']
    const replacePayment = ['', '上海国利货币经纪有限公司', '上海国际货币经纪有限责任公司', '平安利顺国际货币经纪有限责任公司', '中诚宝捷思货币经纪有限公司', '天津信唐货币经纪有限责任公司']
    return (
        <Layout className={styles['container']}>
          <Content style={{ borderRadius: 10, marginRight: 8 }} className={styles['text-area']}>
            <Scrollbars autoHide>
              <Content  className={styles['text-area']}>
                <DatePicker value={dateValue} onChange={e => this.setState({ dateValue: e })} />
                <div style={{ justifyContent: 'space-between', display: 'flex', marginBottom: 10 }}>
                  <h3>解析框</h3>
                  <div>
                  <Button type='primary' onClick={() => this.setState({ textValue: '' })} style={{ marginRight: 10 }}>一键清除</Button>
                  <Button type='primary' onClick={this.handleProcess}>语义解析</Button>
                  </div>
                </div>
                <TextArea placeholder="请粘贴语料..." rows={6} value={textValue} onChange={(e) => this.setState({ textValue: e.target.value })} />
              </Content>
              <Footer className={styles['text-area']}>
                <div style={{ justifyContent: 'space-between', display: 'flex', marginBottom: 10 }}>
                  <h3>解析结果</h3>
                </div>
                {
                  structData && structData.map((item, index) => {
                    return <div className={styles['bond-item']} key={index} >
                      <Row style={{ mariginBottom: 10 }}>
                        <Col span={20}>
                          <span style={{ fontSize: 15, fontWeight: 600, marginLeft: 10 }}>{item.bondname}（{item.bondnameID}）</span>
                        </Col>
                    </Row>
                    {
                      item.data.map((etem, endex) => {
                        return <div className={styles['bond-col']}>
                            <div className={styles['space-between']} style={{ width: '90%' }}>
                              <div>
                                <Select showSearch onSearch={this.fetchOrg} style={{ width: 240 }} dropdownMatchSelectWidth={false} value={etem.orgName} onChange={this.onCellChange(index, endex, 'orgName')}>
                                  {orgData && orgData.map(op => {
                                    return <Option key={op} value={op}>{op}</Option>
                                  })}
                                </Select>
                                <Select dropdownMatchSelectWidth={false} value={etem.tradDirection} onChange={this.onCellChange(index, endex, 'tradDirection')}>
                                  {buyInOut && buyInOut.map(op => {
                                    return <Option key={op} value={op}>{op}</Option>
                                  })}
                                </Select></div>
                              <div style={{ width: '90%', marginLeft: 20 }}>
                                <Row>
                                  <Col span={5}>
                                    <span className={styles['flex-item']}>交易量(万):<EditableCell
                                      value={etem.tradingVolume}
                                      onChange={this.onCellChange(index, endex, 'tradingVolume')}
                                    /></span>
                                  </Col>
                                  <Col span={5}>
                                    <span className={styles['flex-item']}>
                                      <Select value={etem.price || 'netPrice'} onChange={this.onCellChange(index, endex, 'price')} dropdownMatchSelectWidth={false}>
                                        <Option value='netPrice'>净价(元)</Option>
                                        <Option value='ordPrice'>全价(元)</Option>
                                      </Select>
                                      <EditableCell
                                        value={etem.price === 'ordPrice' ? etem.ordPrice : etem.netPrice}
                                        onChange={this.onCellChange(index, endex, etem.price || 'netPrice')}
                                      />
                                    </span>
                                  </Col>
                                  <Col span={5}>
                                    <span className={styles['flex-item']}>
                                      <Select value={etem.yieldOption || 'yield'} onChange={this.onCellChange(index, endex, 'yieldOption')} dropdownMatchSelectWidth={false}>
                                        <Option value='yield'>到期收益率</Option>
                                        <Option value='bnd_yield'>行权收益率</Option>
                                      </Select>
                                      <EditableCell
                                        value={etem.yieldOption === 'bnd_yield' ? etem.bnd_yield : etem.yield}
                                        onChange={this.onCellChange(index, endex, etem.yieldOption || 'yield')}
                                      />
                                    </span>
                                  </Col>
                                  <Col span={5}>
                                    <span className={styles['flex-item']}>留费(L):<EditableCell
                                      value={etem.stayFee}
                                      onChange={this.onCellChange(index, endex, 'stayFee')}
                                    /></span>
                                  </Col>
                                  <Col span={4}>
                                    <span className={styles['flex-item']}>结算速度:<EditableCell
                                      value={etem.settlementSpeed}
                                      onChange={this.onCellChange(index, endex, 'settlementSpeed')}
                                    /></span>
                                  </Col>
                              </Row>
                              <Row style={{ marginTop: 10 }}>
                                  <Col span={5}>
                                  <span className={styles['flex-item']}>请求:&emsp;
                                  <Select dropdownMatchSelectWidth={false} value={etem.requestState} onChange={this.onCellChange(index, endex, 'requestState')}>
                                  {requestOption && requestOption.map(op => {
                                    return <Option key={op} value={op}>{op}</Option>
                                  })}
                                </Select></span>
                                  </Col>
                                  <Col span={5}>
                                    交易时间:&emsp;<DatePicker allowClear={false} style={{ width: 100 }} value={moment(etem.payDay)} onChange={this.onCellChange(index, endex, 'payDay')} />
                                  </Col>
                                  <Col span={5}>
                                    交易员:&emsp;
                                      <Select showSearch style={{ width: 80 }} dropdownMatchSelectWidth={false} value={etem.operator} onChange={this.onCellChange(index, endex, 'operator')}>
                                        {operatorData && operatorData.map(op => {
                                          return <Option value={op.operator}>{op.operator}</Option>
                                        })}
                                      </Select>
                                  </Col>
                                  <Col span={7}>
                                  <span className={styles['flex-item']}>代付:&emsp;<Select dropdownMatchSelectWidth={false} value={etem.replacePayment} onChange={this.onCellChange(index, endex, 'replacePayment')}>
                                    {replacePayment && replacePayment.map(op => {
                                      if (op) {
                                        return <Option key={op} value={op}>{op}</Option>
                                      } else {
                                        return <Option key={op} value={op}>无</Option>
                                      }
                                    })}
                                  </Select></span>
                                  </Col>
                              </Row>
                            </div>
                          </div>
                          <Button type='primary' disabled={etem.changeState} onClick={() => this.submitBtn(etem, index, endex)} >提交</Button>
                        </div>
                      })
                    }
                    </div>
                  })
                }
              </Footer>
            </Scrollbars>
          </Content>
        </Layout>
    )
  }
}

export default TradeComponent
