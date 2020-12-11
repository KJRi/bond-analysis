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
  }

  componentDidMount () {
    this.getOperator()
    // this.handleSearch()
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
          type: findItem.type.split('~')[endex],
          key: endex,
        }
      })
      let inputValue = newArr[newArr.length - 1].matchString
      data.map((etem, endex) => {
        if (endex === index) {
          let newText = textValue.slice(etem.start)
          newText = newText.replace(etem.subString, `<span style="color: red;">${etem.subString}</span>`)
          textValue = textValue.slice(0, etem.start) + newText
        }
      })
      newArr.pop()
      Modal.confirm({
        title: '请选择',
        content: <div>
          <div dangerouslySetInnerHTML={{__html: textValue }} key={index} />
          <p style={{ color: 'red', marginTop: 20 }}>原文标红处匹配多项信息：请选择</p>
          <RadioGroup defaultValue={0} onChange={e => radioValue = e.target.value }>
            {newArr.map(etem => { return <Radio style={radioStyle} key={etem.key} value={etem.key}>{etem.type === '债券名称' ? '【券名】' : '【客户】'} {etem.matchString}</Radio> })}
            <Radio style={radioStyle} value={-1}>标红处无信息</Radio>
            <Radio style={radioStyle} value='custom'><Input addonBefore='自定义客户为' defaultValue={inputValue} onChange={e => inputValue = e.target.value } /></Radio>
          </RadioGroup>
        </div>,
        okText: '确认选择',
        cancelText: '关闭',
        onOk() {
          if (radioValue === 'custom') {
            Modal.confirm({
              title: '选择临时客户',
              content: <p>您确定选择临时客户:  <span style={{ color: 'red' }}>{inputValue}</span></p>,
              okText: '确认',
              cancelText: '取消',
              onOk() {
                const newObj = findItem
                Object.assign(newObj, {
                  matchString: inputValue,
                  type: newArr[newArr.length - 1].type,
                })
                data.splice(index, 1, newObj)
                _this.handleProcessData(data)
              },
            })
          } else if (radioValue === -1) {
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

  render () {
    const { textValue, structData, operatorData, dateValue } = this.state
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
                <TextArea rows={6} value={textValue} onChange={(e) => this.setState({ textValue: e.target.value })} />
              </Content>
              <Footer className={styles['text-area']}>
                <div style={{ justifyContent: 'space-between', display: 'flex', marginBottom: 10 }}>
                  <h3>解析结果</h3>
                  {/* <div>
                    <Button type='primary' style={{ marginRight: 10 }} onClick={this.handleRefresh}>刷新</Button>
                  </div> */}
                </div>
                {
                  structData && structData.map((item, index) => {
                    const buyInArr = item.data.filter(e => { return e.tradDirection === '买入' })
                    const buyOutArr = item.data.filter(e => { return e.tradDirection === '卖出' })
                    return <div className={styles['bond-item']} key={index} >
                      <Row styles={{ mariginBottom: 10 }}>
                        <Col span={20}>
                          <span style={{ fontSize: 15, fontWeight: 600, marginLeft: 10 }}>{item.bondname}（{item.bondnameID}）</span>
                          <span style={{ marginLeft: 20 }}>交易时间：{item.tradeday}</span>
                        </Col>
                        <Col span={4}>
                          <Button type='primary' >提交</Button>
                        </Col>
                    </Row>
                    {
                      buyInArr.map(etem => {
                        return <div>
                          <Row style={{ marginTop: 8 }}>
                            <Col span={4}>
                              <span style={{ marginLeft: 20 }}>{etem.orgName}(买方)</span>
                            </Col>
                            <Col span={4}>
                              <span style={{ marginLeft: 20 }}>交易量(万):{etem.tradingVolume}</span>
                            </Col>
                            <Col span={4}>
                            <span style={{ marginLeft: 20 }}>净价(元):{etem.netPrice}</span>
                            </Col>
                            <Col span={4}>
                            <span style={{ marginLeft: 20 }}>收益率:{etem.yield}</span>
                            </Col>
                            <Col span={4}>
                            <span style={{ marginLeft: 20 }}>留费(L):{etem.stayFee}</span>
                            </Col>
                            <Col span={4}>
                            <span style={{ marginLeft: 20 }}>结算速度:{etem.settlementSpeed}</span>
                            </Col>
                        </Row>
                        <Row style={{ marginTop: 8 }}>
                            <Col span={4} />
                            <Col span={4}>
                              <span style={{ marginLeft: 20 }}>请求:{etem.requestState}</span>
                            </Col>
                            <Col span={4}>
                              <span style={{ marginLeft: 20 }}>代付:{etem.replacePayment}</span>
                            </Col>
                            <Col span={4}>
                            <span style={{ marginLeft: 20 }}>交易员:{etem.operator}</span>
                            </Col>
                        </Row>
                        </div>
                      })
                    }
                    <Row>
                      <Col style={{ paddingLeft: 20 }} span={4}>
                        <Icon style={{ fontSize: 20, fontWeight: 600, color: '#707070' }} type="reload" />
                      </Col>
                      <Col span={20}>
                        <div className={styles['aline']} />
                      </Col>
                    </Row>
                    {
                      buyOutArr.map(etem => {
                        return <div>
                          <Row style={{ marginTop: 8 }}>
                            <Col span={4}>
                              <span style={{ marginLeft: 20 }}>{etem.orgName}(卖方)</span>
                            </Col>
                            <Col span={4}>
                              <span style={{ marginLeft: 20 }}>交易量(万):{etem.tradingVolume}</span>
                            </Col>
                            <Col span={4}>
                            <span style={{ marginLeft: 20 }}>净价(元):{etem.netPrice}</span>
                            </Col>
                            <Col span={4}>
                            <span style={{ marginLeft: 20 }}>收益率:{etem.yield}</span>
                            </Col>
                            <Col span={4}>
                            <span style={{ marginLeft: 20 }}>留费(L):{etem.stayFee}</span>
                            </Col>
                            <Col span={4}>
                            <span style={{ marginLeft: 20 }}>结算速度:{etem.settlementSpeed}</span>
                            </Col>
                        </Row>
                        <Row style={{ marginTop: 8 }}>
                            <Col span={4} />
                            <Col span={4}>
                              <span style={{ marginLeft: 20 }}>请求:{etem.requestState}</span>
                            </Col>
                            <Col span={4}>
                              <span style={{ marginLeft: 20 }}>代付:{etem.replacePayment}</span>
                            </Col>
                            <Col span={4}>
                            <span style={{ marginLeft: 20 }}>交易员:{etem.operator}</span>
                            </Col>
                        </Row>
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
