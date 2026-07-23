
async function get_price_changes() {
    const latestDates = await prisma.card_prices.findMany({
        select: {
            date: true
        },
        distinct: ['date'],
        orderBy: {
            date: 'desc'
        },
        take: 2
    });

    if (latestDates.length < 2) {
        return [];
    }

    const currentDate = latestDates[0].date;
    const previousDate = latestDates[1].date;

    const prices = await prisma.card_prices.findMany({
        where: {
            date: {
                in: [currentDate, previousDate]
            },
            price_usd: {
                not: null
            }
        },
        select: {
            card_id: true,
            price_usd: true,
            date: true,
            cards: {
                select: {
                    name: true,
                    set_name: true,
                    image_uris: true
                }
            }
        }
    });

    const priceMap = new Map<
        string,
        {
            card: {
                name: string | null;
                set_name: string | null;
                image_uris: unknown;
            } | null;
            current?: number;
            previous?: number;
        }
    >();

    for (const item of prices) {
        if (!item.card_id || item.price_usd === null) {
            continue;
        }

        const existing = priceMap.get(item.card_id) ?? {
            card: item.cards
        };

        if (item.date.getTime() === currentDate.getTime()) {
            existing.current = Number(item.price_usd);
        }

        if (item.date.getTime() === previousDate.getTime()) {
            existing.previous = Number(item.price_usd);
        }

        priceMap.set(item.card_id, existing);
    }

    const changes = [];

    for (const [card_id, value] of priceMap.entries()) {
        if (
            value.current == null ||
            value.previous == null ||
            value.previous <= 0
        ) {
            continue;
        }

        const change = value.current - value.previous;

        changes.push({
            card_id,
            card: value.card,
            previous_price: value.previous,
            current_price: value.current,
            change,
            percent_change: (change / value.previous) * 100
        });
    }

    return changes;
}
export async function get_market_movers()
{
 const changes = await get_price_changes();

  changes.sort(
    (a, b) => Math.abs(b.percent_change) - Math.abs(a.percent_change)
  );

  return changes.slice(0,5);
}


export async function get_featured_cards() {

    const changes = await get_price_changes();

    const featured = changes
        .filter((item) => {
            if (!item.card) {
                return false;
            }

            if (!item.card.name) {
                return false;
            }

            if (!item.card.image_uris) {
                return false;
            }

            return true;
        })
        .sort(
            (a, b) =>
                Math.abs(b.percent_change) -
                Math.abs(a.percent_change)
        );

    return featured.slice(0, 8);
}


