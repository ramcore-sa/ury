import click
import frappe

from ury.setup_customizations import after_install as setup


def after_install():
    try:
        print("Setting up URY...")
        setup()
        use_pos_invoice()

        click.secho("Thank you for installing URY App!", fg="green")


    except Exception as e:
        print(f"Error during installation: {e}")
        pass


def use_pos_invoice():
    """Every URY order is a POS Invoice, and ERPNext v16's POS Settings default
    to "Sales Invoice", which refuses POS Invoices outright: orders, KOTs and the
    setup wizard's POS demo all failed on it. After every migrate too, for sites
    that installed URY before this existed."""
    # The setting is v16's; on earlier ERPNext POS Invoice is the only kind.
    if not frappe.get_meta("POS Settings").has_field("invoice_type"):
        return
    if frappe.db.get_single_value("POS Settings", "invoice_type") != "POS Invoice":
        frappe.db.set_single_value("POS Settings", "invoice_type", "POS Invoice")
