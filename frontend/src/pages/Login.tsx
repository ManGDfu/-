import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../stores/authStore'
import type { LoginRequest } from '../types/auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(from, { replace: true })
    }
  }, [from, isAuthenticated, navigate])

  const mutation = useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.role)
      navigate(from, { replace: true })
    },
  })

  return (
    <div className="login-page">
      <Card className="login-card" title="预制菜供应链管理系统">
        <Typography.Paragraph type="secondary">
          示例账号：user0001 / Pass@123（Admin）
        </Typography.Paragraph>
        <Form<LoginRequest>
          layout="vertical"
          initialValues={{ username: 'user0001', password: 'Pass@123' }}
          onFinish={(values) => mutation.mutate(values)}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          {mutation.isError && (
            <Alert
              type="error"
              showIcon
              message="登录失败，请检查用户名与密码"
              style={{ marginBottom: 16 }}
            />
          )}
          <Button type="primary" htmlType="submit" block loading={mutation.isPending}>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  )
}
