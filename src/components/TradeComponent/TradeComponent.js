// @flow
import React from 'react'
import styles from './TradeComponent.css'
import { Layout, Button, Input, Modal, Radio, Select, Icon, message, Popconfirm, DatePicker, Row, Col, Collapse } from 'antd'
import moment from 'moment'
import EditableCell from 'components/EditableCell'
import Scrollbars from 'react-custom-scrollbars'
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
          target['operatorID'] = obj.operatorID;
        }
        if (dataIndex === 'payDay') {
          target[dataIndex] = moment(value).format('YYYY-MM-DD');
        } else {
          target[dataIndex] = value
        }
        // target['changeState'] = false
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
                                      <Select dropdownMatchSelectWidth={false}>
                                        <Option value='净价'>: <EditableCell
                                          value={etem.netPrice}
                                          onChange={this.onCellChange(index, endex, 'netPrice')}
                                        /></Option>
                                        <Option value='全价'>: <EditableCell
                                          value={etem.ordPrice}
                                          onChange={this.onCellChange(index, endex, 'ordPrice')}
                                        /></Option>
                                      </Select>
                                    </span>
                                  </Col>
                                  <Col span={5}>
                                    <span className={styles['flex-item']}>
                                      <Select dropdownMatchSelectWidth={false}>
                                        <Option value='到期收益率'>: <EditableCell
                                          value={etem.yield}
                                          onChange={this.onCellChange(index, endex, 'yield')}
                                        /></Option>
                                        <Option value='行权收益率'>: <EditableCell
                                          value={etem.bnd_yield}
                                          onChange={this.onCellChange(index, endex, 'bnd_yield')}
                                        /></Option>
                                      </Select>
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
                                      return <Option key={op} value={op}>{op}</Option>
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
