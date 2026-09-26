import { useEffect } from 'react'
import { Col, Form, Input, Modal, Row, Select, Typography } from 'antd'
import type { Category, Product, ProductWriteRequest } from '../../api'

const { Paragraph } = Typography

interface ProductFormModalProps {
  open: boolean
  product: Product | null
  categories: Category[]
  saving: boolean
  onCancel: () => void
  onSubmit: (values: ProductWriteRequest) => Promise<void>
}

export function ProductFormModal({
  open,
  product,
  categories,
  saving,
  onCancel,
  onSubmit,
}: ProductFormModalProps) {
  const [form] = Form.useForm<ProductWriteRequest>()

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue(
      product
        ? {
            productName: product.productName,
            genericName: product.genericName,
            categoryId: product.categoryId,
            dosageForm: product.dosageForm,
            strength: product.strength,
            description: product.description,
            availabilityStatus: product.availabilityStatus,
          }
        : { categoryId: categories[0]?.id, availabilityStatus: 'Available' },
    )
  }, [categories, form, open, product])

  return (
    <Modal
      open={open}
      title={product ? 'Edit product' : 'Add product'}
      okText={product ? 'Save changes' : 'Create product'}
      confirmLoading={saving}
      okButtonProps={{ disabled: categories.length === 0 }}
      onCancel={onCancel}
      onOk={() => void form.submit()}
      destroyOnHidden
      width={640}
    >
      <Paragraph type="secondary">Fields marked required are needed to maintain a complete catalogue record.</Paragraph>
      <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark="optional">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="productName" label="Product name" rules={[{ required: true, whitespace: true, message: 'Enter a product name.' }, { max: 150 }]}>
              <Input maxLength={150} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="genericName" label="Generic name" rules={[{ max: 150 }]}>
              <Input maxLength={150} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="categoryId" label="Category" rules={[{ required: true, message: 'Select a category.' }]}>
              <Select options={categories.map((category) => ({ label: category.name, value: category.id }))} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="dosageForm" label="Dosage form" rules={[{ required: true, whitespace: true, message: 'Enter a dosage form.' }, { max: 100 }]}>
              <Input maxLength={100} placeholder="Tablet, capsule, syrup..." />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="strength" label="Strength" rules={[{ max: 100 }]}>
          <Input maxLength={100} placeholder="For example, 500 mg" />
        </Form.Item>
        <Form.Item name="availabilityStatus" label="Availability">
          <Select options={[{ label: 'Available', value: 'Available' }, { label: 'Out of stock', value: 'OutOfStock' }]} />
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[{ max: 1000 }]}>
          <Input.TextArea rows={4} maxLength={1000} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}
