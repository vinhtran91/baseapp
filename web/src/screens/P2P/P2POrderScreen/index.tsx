import React, { FC, ReactElement, useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { Decimal } from 'src/components';
import { Dispute, OrderWaitConfirmation, OrderWaitPayment } from 'src/containers';
import { localeDate } from 'src/helpers';
import { useCurrenciesFetch, useDocumentTitle } from 'src/hooks';
import { useP2POrderFetch } from 'src/hooks/useP2POrderFetch';
import { selectCurrencies, selectP2PCreatedOrder } from 'src/modules';
import { Currency, P2POrder } from '../../../modules';

interface ParamType {
    id?: string;
}

export const P2POrderScreen: FC = (): ReactElement => {
    const { formatMessage } = useIntl();
    const { id } = useParams<ParamType>();
    const order: P2POrder = useSelector(selectP2PCreatedOrder);
    const currencies: Currency[] = useSelector(selectCurrencies);

    useDocumentTitle('P2P Order Transfer');
    useCurrenciesFetch();
    useP2POrderFetch(id);
    const history = useHistory();

    useEffect(() => {
        if (order?.state === 'cancelled') {
            history.push('/p2p');
        }
    }, [order, history]);

    const translate = useCallback((id: string) => formatMessage({ id: id }), [formatMessage]);

    const title = useCallback(() => {
        return order && `${translate(`page.body.p2p.order.transfer.title.${order.side}`)} ${order.base?.toUpperCase()}`; 
    }, [order, translate]);

    const content = useCallback(() => {
        if (order) {
            switch (order.state) {
                case 'prepared':
                    return order.side === 'buy'
                        ? <OrderWaitPayment order={order}/>
                        : <OrderWaitConfirmation order={order} />;
                case 'wait':
                    return order.side === 'buy'
                        ? <OrderWaitConfirmation order={order} />
                        : <OrderWaitPayment order={order}/>;
                case 'dispute':
                    return <Dispute order={order}/>;
                default:
                    return;
            }
        }
    }, [order]);

    const getPrecision = useCallback((cur: string) => {
        return cur && currencies.find(i => i.id === cur.toLowerCase())?.precision;
    }, [currencies]);

    return (
        <React.Fragment>
            <div className="pg-transfer-order pg-container">
                <div className="pg-transfer-order__header">
                    <span className="pg-transfer-order__header-title">{title()}</span>
                    <div className="pg-transfer-order__header-info">
                        <div className="pg-transfer-order__header-info--row">
                            <div className="label">{translate('page.body.p2p.order.transfer.created.time')}</div>
                            <div className="value">{order ? localeDate(order.created_at, "fullDate") : '-'}</div>
                        </div>
                        <div className="pg-transfer-order__header-info--row">
                            <div className="label">{translate('page.body.p2p.order.transfer.order.number')}</div>
                            <div className="value">{order ? order.id : '-'}</div>
                        </div>
                    </div>
                </div>
                <div className="pg-transfer-order__subheader">
                    <div className="pg-transfer-order__subheader-grid">
                        <div className="pg-transfer-order__subheader-grid-info">
                            <div className="label">{translate('page.body.p2p.order.transfer.amount')}</div>
                            <div className="value">{order ? Decimal.format(+order.amount * +order.price, getPrecision(order.quote), ',') : '-'}&nbsp;{order?.quote?.toUpperCase()}</div>
                        </div>
                        <div className="pg-transfer-order__subheader-grid-info">
                            <div className="label">{translate('page.body.p2p.order.transfer.price')}</div>
                            <div className="value">{order ? Decimal.format(order.price, getPrecision(order.quote), ',') : '-'}&nbsp;{order?.quote?.toUpperCase()}</div>
                        </div>
                        <div className="pg-transfer-order__subheader-grid-info">
                            <div className="label">{translate('page.body.p2p.order.transfer.quantity')}</div>
                            <div className="value">{order ? Decimal.format(order.amount, getPrecision(order.base), ',') : '-'}&nbsp;{order?.base?.toUpperCase()}</div>
                        </div>
                    </div>
                </div>
                <div className="pg-transfer-order__content">
                    {content()}
                </div>
            </div>
            <div className="pg-transfer-order__tips pg-container">
                <span className="pg-transfer-order__tips--title">{translate('page.body.p2p.order.transfer.tips')}</span>
                <span className="pg-transfer-order__tips--text">{translate('page.body.p2p.order.transfer.tips.text')}</span>
            </div>
        </React.Fragment>
    );
};